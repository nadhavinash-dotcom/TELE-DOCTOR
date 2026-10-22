import os, re, io, time, hmac
from datetime import datetime, timezone
from xml.sax.saxutils import escape as esc
from fastapi import FastAPI, HTTPException, Depends, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from starlette.concurrency import run_in_threadpool
from pydantic import BaseModel
from dotenv import load_dotenv
from pymongo import MongoClient, DESCENDING, ReturnDocument
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen.canvas import Canvas
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether

load_dotenv()
URI = os.getenv("MONGODB_URI", "")
if not URI or "YOUR_PASSWORD" in URI: raise SystemExit("Set MONGODB_URI (with your real password) in backend/.env")
if URI.split("://", 1)[-1].split("/", 1)[0].count("@") > 1: raise SystemExit("The MongoDB password contains '@'. Write it as %40 in MONGODB_URI.")
client = MongoClient(URI, serverSelectionTimeoutMS=8000)
try: client.admin.command("ping")
except Exception as ex: raise SystemExit(f"Cannot connect to MongoDB ({ex.__class__.__name__}). Check the password and allow your IP in Atlas > Network Access.")
db = client[os.getenv("MONGODB_DB", "teleconsult")]
col, logs, counters = db.consultations, db.logs, db.counters
col.create_index([("updated", DESCENDING)]); logs.create_index("ts", expireAfterSeconds=30 * 86400)
ADMIN_KEY = os.getenv("ADMIN_KEY", "")
now = lambda: datetime.now(timezone.utc)
iso = lambda t: t.replace(tzinfo=timezone.utc).isoformat() if t else ""

def log(level, message, **x):
    try: logs.insert_one({"ts": now(), "level": level, "message": message, **x})
    except Exception: pass

app = FastAPI(title="Teleconsultation API")
app.add_middleware(CORSMiddleware, allow_origins=[o.strip() for o in os.getenv("FRONTEND_ORIGIN", "http://localhost:5173").split(",")], allow_methods=["*"], allow_headers=["*"])

@app.middleware("http")
async def access_log(req: Request, call_next):
    t = time.time(); path = req.url.path
    try: resp = await call_next(req)
    except Exception as ex:
        await run_in_threadpool(log, "ERROR", f"Unhandled error: {ex}", method=req.method, path=path); raise
    if req.method != "OPTIONS" and path != "/api/health" and not path.startswith("/api/admin/logs"):
        c = resp.status_code
        await run_in_threadpool(log, "ERROR" if c >= 500 else "WARN" if c >= 400 else "INFO", f"{req.method} {path} -> {c}", method=req.method, path=path, status=c, ms=round((time.time() - t) * 1000), ip=req.client.host if req.client else "")
    return resp

def admin(x_admin_key: str = Header(None)):
    if ADMIN_KEY and not hmac.compare_digest(x_admin_key or "", ADMIN_KEY): raise HTTPException(401, "Admin key required")

class Save(BaseModel):
    id: str
    data: dict

def clean(o):
    if isinstance(o, dict):
        for k, v in o.items():
            if "$" in k or "." in k: raise HTTPException(400, "Invalid field name")
            clean(v)
    elif isinstance(o, list):
        for v in o: clean(v)

def pid_for(key):
    if key:
        ex = col.find_one({"phoneKey": key, "patientId": {"$exists": True}}, {"patientId": 1})
        if ex: return ex["patientId"]
    n = counters.find_one_and_update({"_id": "patient"}, {"$inc": {"seq": 1}}, upsert=True, return_document=ReturnDocument.AFTER)["seq"]
    return f"P{n:03d}"

def reg_for(d):
    c = d.get("clin") or {}
    for t in (c.get("complaints", ""), c.get("dx", "")):
        for l in str(t).split("\n"):
            if l.strip(): return l.strip()[:80]
    return ""

def get_or_404(cid):
    r = col.find_one({"_id": cid})
    if not r: raise HTTPException(404, "Consultation not found")
    return r

@app.get("/api/health")
def health(): return {"ok": True}

# ---------- doctor app ----------
@app.get("/api/consultations")
def list_():
    return [{"id": r["_id"], "status": r.get("status", "Draft"), "patient": r.get("name", ""), "date": r.get("date", ""), "updated": iso(r.get("updated"))} for r in col.find().sort("updated", -1).limit(200)]

@app.post("/api/consultations")
def save(b: Save):
    if not re.fullmatch(r"TC-\d{8}-[A-Z0-9]{5}", b.id): raise HTTPException(400, "Bad consultation id")
    d = b.data; clean(d)
    if len(str(d)) > 300_000: raise HTTPException(413, "Record too large")
    p, m = d.get("patient") or {}, d.get("meta") or {}
    st = "Complete" if m.get("status") in ("Complete", "Completed") else "Draft"
    key = re.sub(r"\D", "", str(p.get("phone", "")))[-10:]
    ex = col.find_one({"_id": b.id}, {"patientId": 1})
    pid = (ex or {}).get("patientId") or pid_for(key)
    col.update_one({"_id": b.id}, {"$set": {"data": d, "status": st, "patientId": pid, "name": p.get("name", ""), "phoneKey": key, "registeredFor": reg_for(d), "date": m.get("date", ""), "updated": now()}, "$setOnInsert": {"created": now()}}, upsert=True)
    log("INFO", f"Consultation {b.id} saved as {st} (patient {pid})", ref=b.id)
    return {"id": b.id, "status": st, "patientId": pid}

@app.get("/api/consultations/{cid}")
def get(cid: str):
    r = get_or_404(cid); return {"id": cid, "status": r.get("status", "Draft"), "data": r["data"]}

@app.delete("/api/consultations/{cid}", status_code=204)
def delete(cid: str):
    get_or_404(cid); col.delete_one({"_id": cid}); log("WARN", f"Consultation {cid} deleted", ref=cid)

def pdf_response(cid):
    r = get_or_404(cid)
    buf = build_pdf(cid, r["data"], r.get("status", "Draft")); log("INFO", f"PDF generated for {cid}", ref=cid)
    return StreamingResponse(buf, media_type="application/pdf", headers={"Content-Disposition": f'attachment; filename="consultation-{cid}.pdf"'})

@app.get("/api/consultations/{cid}/pdf")
def pdf(cid: str): return pdf_response(cid)

# ---------- admin portal ----------
@app.get("/api/admin/patients")
def a_patients(q: str = "", status: str = "", page: int = 1, size: int = 10, _=Depends(admin)):
    f = {}
    if q.strip():
        rx = {"$regex": re.escape(q.strip()), "$options": "i"}; f["$or"] = [{"name": rx}, {"patientId": rx}, {"registeredFor": rx}, {"_id": rx}]
    if status in ("Draft", "Complete"): f["status"] = status
    size, page = max(1, min(size, 100)), max(1, page); total = col.count_documents(f)
    items = [{"id": r["_id"], "patientId": r.get("patientId", ""), "name": r.get("name", ""), "date": r.get("date", ""), "registeredFor": r.get("registeredFor", ""), "status": r.get("status", "Draft")}
             for r in col.find(f).sort("updated", -1).skip((page - 1) * size).limit(size)]
    return {"items": items, "total": total, "page": page, "pages": max(1, -(-total // size))}

@app.get("/api/admin/patients/{cid}")
def a_patient(cid: str, _=Depends(admin)):
    r = get_or_404(cid)
    return {"id": cid, "patientId": r.get("patientId", ""), "status": r.get("status", "Draft"), "created": iso(r.get("created")), "updated": iso(r.get("updated")), "data": r["data"]}

@app.get("/api/admin/patients/{cid}/pdf")
def a_pdf(cid: str, _=Depends(admin)): return pdf_response(cid)

@app.get("/api/admin/logs")
def a_logs(level: str = "", q: str = "", page: int = 1, size: int = 15, _=Depends(admin)):
    f = {}
    if level in ("INFO", "WARN", "ERROR"): f["level"] = level
    if q.strip(): f["message"] = {"$regex": re.escape(q.strip()), "$options": "i"}
    size, page = max(1, min(size, 100)), max(1, page); total = logs.count_documents(f)
    items = [{"ts": iso(r["ts"]), "level": r["level"], "message": r["message"], "method": r.get("method", ""), "path": r.get("path", ""), "status": r.get("status", ""), "ms": r.get("ms", ""), "ip": r.get("ip", "")}
             for r in logs.find(f).sort("ts", -1).skip((page - 1) * size).limit(size)]
    return {"items": items, "total": total, "page": page, "pages": max(1, -(-total // size))}

# ---------- PDF ----------
def numbered(cid, status):
    class NC(Canvas):
        def __init__(self, *a, **k): super().__init__(*a, **k); self._st = []
        def showPage(self): self._st.append(dict(self.__dict__)); self._startPage()
        def save(self):
            n = len(self._st)
            for st in self._st: self.__dict__.update(st); self.deco(n); Canvas.showPage(self)
            Canvas.save(self)
        def deco(self, n):
            w, h = A4
            self.setFillColor(colors.HexColor("#0f766e")); self.rect(0, h - 7, w, 7, stroke=0, fill=1)
            if status != "Complete":
                self.saveState(); self.setFont("Helvetica-Bold", 90); self.setFillColor(colors.Color(0, 0, 0, alpha=.05)); self.translate(w / 2, h / 2); self.rotate(35); self.drawCentredString(0, 0, "DRAFT"); self.restoreState()
            self.setStrokeColor(colors.HexColor("#dbe4ea")); self.line(36, 34, w - 36, 34)
            self.setFont("Helvetica", 7); self.setFillColor(colors.HexColor("#64748b"))
            self.drawString(36, 22, "Teleconsultation Record \u2022 Not a substitute for physical in-person emergency evaluation \u2022 Ref " + cid)
            self.drawRightString(w - 36, 22, f"Page {self._pageNumber} of {n}")
    return NC

def build_pdf(cid, d, status="Draft"):
    buf = io.BytesIO(); W = 523; ss = getSampleStyleSheet()
    TEAL, LINE, BG = colors.HexColor("#0f766e"), colors.HexColor("#dbe4ea"), colors.HexColor("#f4f7fa")
    N = ParagraphStyle("n", parent=ss["Normal"], fontName="Helvetica", fontSize=8.5, leading=11.5, textColor=colors.HexColor("#0f1f3d"))
    BL = ParagraphStyle("bl", parent=N, leftIndent=9, firstLineIndent=-9)
    RT = ParagraphStyle("rt", parent=N, alignment=2, fontSize=8, leading=11)
    HD = ParagraphStyle("hd", parent=N, fontSize=8, leading=10, textColor=TEAL)
    e = lambda t: esc(str(t if t is not None else "")).replace("\n", "<br/>")
    P = lambda t, st=N: Paragraph(t, st)
    g = lambda k: d.get(k) or {}
    dr, p, v, c, a, m = g("doctor"), g("patient"), g("vitals"), g("clin"), g("adv"), g("meta")
    lines = lambda t: [x.strip() for x in str(t or "").split("\n") if x.strip()]
    def cap(label, val, col="#0f1f3d", lc="#64748b"): return P(f'<font size="6" color="{lc}">{e(label).upper()}</font><br/><b><font color="{col}">{e(val)}</font></b>')
    PAD = [("LEFTPADDING", (0, 0), (-1, -1), 7), ("RIGHTPADDING", (0, 0), (-1, -1), 7), ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 6), ("VALIGN", (0, 0), (-1, -1), "TOP")]
    def box(rows, widths, extra=(), bg=BG, line=LINE):
        t = Table(rows, colWidths=widths); t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), bg), ("BOX", (0, 0), (-1, -1), .6, line), *PAD, *extra])); return t
    def sec(title):
        t = Table([[P(f"<b>{e(title)}</b>", HD)]], colWidths=[W])
        t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#e8f3f1")), ("LINEBEFORE", (0, 0), (0, 0), 3, TEAL), ("LEFTPADDING", (0, 0), (-1, -1), 8), ("TOPPADDING", (0, 0), (-1, -1), 3), ("BOTTOMPADDING", (0, 0), (-1, -1), 4)])); return t
    def two(lt, lf, rt, rf):
        L = [P(f'<b><font color="#0f766e">{lt}</font></b>', HD), Spacer(1, 3), *lf] if lf else None
        R = [P(f'<b><font color="#0f766e">{rt}</font></b>', HD), Spacer(1, 3), *rf] if rf else None
        if L and R:
            t = Table([[L, "", R]], colWidths=[W / 2 - 4, 8, W / 2 - 4])
            t.setStyle(TableStyle([("BACKGROUND", (0, 0), (0, 0), BG), ("BACKGROUND", (2, 0), (2, 0), BG), ("BOX", (0, 0), (0, 0), .6, LINE), ("BOX", (2, 0), (2, 0), .6, LINE), *PAD])); return t
        return box([[L or R]], [W]) if (L or R) else None
    s = []
    def add(*fl):
        for f in fl:
            if f is not None: s.append(f)
        s.append(Spacer(1, 8))
    # header
    reg = [x for x in (f'Reg. No: <b><font color="#0f766e">{e(dr.get("reg"))}</font></b>' + (f' ({e(dr.get("council"))})' if dr.get("council") else "") if dr.get("reg") else "", f'Phone: {e(dr.get("phone"))}' if dr.get("phone") else "") if x]
    left = [P('<font size="7" color="#0f766e"><b>TELECONSULTATION RECORD</b></font>'), Spacer(1, 4),
            P(f'<font size="19"><b>{e(dr.get("name"))}</b></font> <font size="10" color="#0f766e"><b>{e(dr.get("qual"))}</b></font>', ParagraphStyle("dn", parent=N, leading=23)), Spacer(1, 2),
            P(e(dr.get("spec"))), P(" \u2022 ".join(reg))]
    right = P(f'Date: <b>{e(m.get("date"))} {e(m.get("time"))}</b><br/>Ref ID: <b>{e(cid)}</b><br/>Type: {e(m.get("type"))} ({e(m.get("mode"))})', RT)
    ht = Table([[left, right]], colWidths=[350, 173]); ht.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0)]))
    add(ht)
    # patient
    cells = [(k, x) for k, x in (("Name & Demographics", " \u2022 ".join(y for y in (p.get("name"), " / ".join(z for z in (p.get("age"), p.get("gender")) if z)) if y)),
                                 ("Contact", " \u2022 ".join(y for y in (p.get("phone"), p.get("email")) if y)), ("Location", ", ".join(y for y in (p.get("city"), p.get("state"), p.get("pin")) if y)),
                                 ("Emergency contact", p.get("emergency"))) if x]
    if cells: add(sec("PATIENT DETAILS"), box([[cap(k, x) for k, x in cells]], [W / len(cells)] * len(cells), [("INNERGRID", (0, 0), (-1, -1), .6, LINE)]))
    # vitals + allergies
    vc, ex = [], []
    if v.get("ignore"): vc.append(("Vitals", "Vitals are confirmed as stated by patient.", "#0f1f3d", None))
    else:
        mm = re.match(r"\s*(\d+)\s*/\s*(\d+)", str(v.get("bp", "")))
        hi = bool(mm) and (int(mm.group(1)) >= 140 or int(mm.group(2)) >= 90)
        for k, x, col in (("Blood pressure", f'{v["bp"]} mmHg' if v.get("bp") else "", "#b91c1c" if hi else "#0f1f3d"), ("Pulse", f'{v["pulse"]} bpm' if v.get("pulse") else "", "#0f1f3d"), ("SpO2", f'{v["spo2"]}%' if v.get("spo2") else "", "#0f1f3d"),
                          ("Temperature", f'{v["temp"]} {v.get("tempUnit", "")}' if v.get("temp") else "", "#0f1f3d"), ("Weight", f'{v["weight"]} kg' if v.get("weight") else "", "#0f1f3d"), ("Height", f'{v["height"]} cm' if v.get("height") else "", "#0f1f3d")):
            if x: vc.append((k, x, col, None))
    al = " | ".join(x for x in (v.get("allergies"), v.get("special")) if x)
    if al: vc.append(("Allergies & safety", al, "#b45309", "#fef3c7"))
    if vc:
        wts = [2.4 if (v.get("ignore") and i == 0) else (1.5 if x[0].startswith("Allergies") else 1) for i, x in enumerate(vc)]; tot = sum(wts)
        st = [("INNERGRID", (0, 0), (-1, -1), .6, LINE)] + [("BACKGROUND", (i, 0), (i, 0), x[3]) for i, x in enumerate(vc) if x[3]]
        ttl = "VITALS & ALLERGIES" if v.get("ignore") else f'VITALS ({str(v.get("source") or "").upper()}) & ALLERGIES'
        add(sec(ttl), box([[cap(x[0], x[1], x[2], "#92400e" if x[3] else "#64748b") for x in vc]], [W * w / tot for w in wts], st))
    # clinical
    lf = ([P(f'<b>Onset &amp; Duration:</b> {e(c.get("onset"))}')] if c.get("onset") else []) + [P("\u2022 " + e(x), BL) for x in lines(c.get("complaints"))]
    rf = ([P(f'<b>Medical History:</b> {e(c.get("hx"))}')] if c.get("hx") else []) + ([P(f'<b>Provisional Diagnosis:</b> {e(c.get("dx"))}')] if c.get("dx") else [])
    if c.get("notes"):
        rf += [Spacer(1, 3), box([[P(f'<font color="#b91c1c"><b>Clinical Direction:</b></font> <font color="#7f1d1d">{e(c["notes"])}</font>')]], [W / 2 - 22], bg=colors.HexColor("#fef2f2"), line=colors.HexColor("#fecaca"))]
    cl = two("CLINICAL PRESENTATION &amp; SYMPTOMS", lf, "ASSESSMENT &amp; IMPRESSION", rf)
    if cl: add(cl)
    # investigations
    if d.get("inv"):
        its = [P(f'{i}. {e(x.get("name"))} <font size="6" color="#1d4ed8"><b>[{e(str(x.get("status", "")).upper())}]</b></font>' + (f' <font color="#64748b">{e(x.get("instr"))}</font>' if x.get("instr") else "")) for i, x in enumerate(d["inv"], 1)]
        if len(its) % 2: its.append("")
        add(sec("DIAGNOSTIC INVESTIGATIONS ADVISED"), box([[its[i], its[i + 1]] for i in range(0, len(its), 2)], [W / 2, W / 2]))
    # prescription
    hdr = [P(f'<font color="white"><b>{h}</b></font>') for h in ("#", "Drug Name", "Strength", "Route", "Frequency", "Duration", "Instructions")]
    if d.get("meds"):
        rows = [hdr] + [[P(str(i)), P(f'<b>{e(x.get("name"))}</b>'), P(e(x.get("strength"))), P(e(x.get("route"))), P(e(x.get("freq"))), P(e(x.get("dur"))), P(e(x.get("instr")))] for i, x in enumerate(d["meds"], 1)]
        t = Table(rows, colWidths=[22, 128, 62, 46, 92, 58, 115], repeatRows=1)
        t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), TEAL), ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f6f9fb")]), ("LINEBELOW", (0, 1), (-1, -1), .4, LINE), ("BOX", (0, 0), (-1, -1), .6, LINE), ("VALIGN", (0, 0), (-1, -1), "MIDDLE"), ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5)]))
        add(sec("RX \u2014 MEDICATIONS PRESCRIBED"), t)
    else: add(sec("RX \u2014 MEDICATIONS"), box([[P("No medicines prescribed.")]], [W]))
    # advice / follow-up
    af = [P("\u2022 " + e(x), BL) for x in lines(a.get("advice"))] + [P(f"<b>{lb}:</b> {e(a[k])}") for k, lb in (("diet", "Diet"), ("lifestyle", "Lifestyle"), ("counsel", "Medication counselling")) if a.get(k)]
    ff = ([P(f'<b>Review Date:</b> {e(a["follow"])} ({e(a.get("followMode"))})')] if a.get("follow") else []) + ([P(f'<b>Action Required:</b> {e(a["instr"])}')] if a.get("instr") else []) + ([P(f'<b>Bring to Follow-up:</b> <font color="#0f766e">{e(a["bring"])}</font>')] if a.get("bring") else []) + ([P(e(a["notes"]))] if a.get("notes") else [])
    ad = two("DIETARY &amp; LIFESTYLE ADVICE", af, "FOLLOW-UP SCHEDULE", ff)
    if ad: add(ad)
    if a.get("flags"): add(KeepTogether(box([[P(f'<font color="#b91c1c"><b>EMERGENCY RED-FLAG WARNING</b></font><br/><font color="#7f1d1d">{e(a["flags"])}</font>')]], [W], bg=colors.HexColor("#fef2f2"), line=colors.HexColor("#fecaca"))))
    sg = Table([["", [P("______________________", RT), P(f'<b>{e(dr.get("name"))}</b>', RT), P(e(dr.get("qual")), RT), P('<font size="6.5" color="#64748b">Not digitally signed</font>', RT)]]], colWidths=[343, 180])
    s += [Spacer(1, 18), KeepTogether(sg)]
    SimpleDocTemplate(buf, pagesize=A4, leftMargin=36, rightMargin=36, topMargin=34, bottomMargin=46, title=f"Consultation {cid}").build(s, canvasmaker=numbered(cid, status))
    buf.seek(0); return buf
