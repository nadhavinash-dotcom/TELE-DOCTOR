import os, re, json, hmac, hashlib, base64, secrets, sqlite3, time, io, threading
from xml.sax.saxutils import escape as esc
from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from dotenv import load_dotenv
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, Table, TableStyle, KeepTogether

load_dotenv()
db = sqlite3.connect(os.getenv("DB_PATH", "tele.db"), check_same_thread=False, isolation_level=None)
db.row_factory = sqlite3.Row
lock = threading.Lock()
def q(sql, args=()):
    with lock:
        return db.execute(sql, args).fetchall()
q("""create table if not exists c(id text primary key, data text, status text, created text default current_timestamp, updated text default current_timestamp)""")

app = FastAPI(title="Teleconsultation API")
app.add_middleware(CORSMiddleware, allow_origins=[os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")], allow_methods=["*"], allow_headers=["*"])

class Save(BaseModel):
    id: str
    data: dict

# ---------- consultations ----------
def own(cid):
    r = q("select * from c where id=?", (cid,))
    if not r: raise HTTPException(404, "Consultation not found")
    return r[0]

@app.get("/api/health")
def health(): return {"ok": True}

@app.get("/api/consultations")
def list_():
    out = []
    for r in q("select id,status,data,updated from c order by updated desc"):
        d = json.loads(r["data"]); out.append({"id": r["id"], "status": r["status"], "patient": (d.get("patient") or {}).get("name", ""), "date": (d.get("meta") or {}).get("date", ""), "updated": r["updated"]})
    return out

@app.post("/api/consultations")
def save(b: Save):
    if not re.fullmatch(r"TC-\d{8}-[A-Z0-9]{5}", b.id): raise HTTPException(400, "Bad consultation id")
    raw = json.dumps(b.data)
    if len(raw) > 300_000: raise HTTPException(413, "Record too large")
    st = "Complete" if (b.data.get("meta") or {}).get("status") in ("Complete", "Completed") else "Draft"
    if q("select 1 from c where id=?", (b.id,)): q("update c set data=?, status=?, updated=current_timestamp where id=?", (raw, st, b.id))
    else: q("insert into c(id,data,status) values(?,?,?)", (b.id, raw, st))
    return {"id": b.id, "status": st}

@app.get("/api/consultations/{cid}")
def get(cid: str):
    r = own(cid); return {"id": cid, "status": r["status"], "data": json.loads(r["data"])}

@app.delete("/api/consultations/{cid}", status_code=204)
def delete(cid: str):
    own(cid); q("delete from c where id=?", (cid,))

# ---------- PDF ----------
def build_pdf(cid, d, status="Draft"):
    buf = io.BytesIO(); ss = getSampleStyleSheet(); T = colors.HexColor("#0f766e")
    N = ParagraphStyle("n", parent=ss["Normal"], fontSize=9, leading=12)
    H = ParagraphStyle("h", parent=ss["Heading3"], textColor=T, backColor=colors.HexColor("#e6f4f1"), borderPadding=(3, 4, 3, 4), spaceBefore=10, spaceAfter=5, fontSize=10)
    P = lambda t, st=N: Paragraph(esc(str(t)).replace("\n", "<br/>"), st)
    g = lambda s, k: str((d.get(s) or {}).get(k, "") or "")
    bullets = lambda t: [P("• " + l.strip()) for l in str(t).split("\n") if l.strip()]
    def footer(c, doc):
        c.setFont("Helvetica", 7.5); c.setFillColor(colors.grey)
        c.drawString(36, 22, f"Teleconsultation record | Ref {cid} | Not a substitute for in-person clinical evaluation | Not digitally signed")
        c.drawRightString(A4[0] - 36, 22, f"Page {doc.page}")
        c.setFillColor(T); c.rect(0, A4[1] - 8, A4[0], 8, stroke=0, fill=1)
        if status != "Complete":  # DRAFT watermark until the record is marked Complete
            c.saveState(); c.setFont("Helvetica-Bold", 90); c.setFillColor(colors.Color(0, 0, 0, alpha=.06)); c.translate(A4[0] / 2, A4[1] / 2); c.rotate(35); c.drawCentredString(0, 0, "DRAFT"); c.restoreState()
    doc = BaseDocTemplate(buf, pagesize=A4, leftMargin=36, rightMargin=36, topMargin=40, bottomMargin=44, title=f"Consultation {cid}")
    doc.addPageTemplates([PageTemplate(frames=[Frame(36, 44, A4[0] - 72, A4[1] - 84)], onPage=footer)])
    m, p, v, c, a = (d.get(k) or {} for k in ("meta", "patient", "vitals", "clin", "adv"))
    reg = f"Reg. No: {g('doctor','reg')}" + (f" ({g('doctor','council')})" if g("doctor", "council") else "") + (f" | {g('doctor','phone')}" if g("doctor", "phone") else "")
    s = [Table([[Paragraph(f"<b>TELECONSULTATION RECORD</b><br/><font size=17>{esc(g('doctor','name'))} <font color='#0f766e'>{esc(g('doctor','qual'))}</font></font><br/>{esc(g('doctor','spec'))}<br/>{esc(reg)}", N),
                 Paragraph(f"Date: {esc(m.get('date',''))} {esc(m.get('time',''))}<br/>Ref: {esc(cid)}<br/>{esc(m.get('type',''))} ({esc(m.get('mode',''))})", ParagraphStyle("r", parent=N, alignment=2))]], colWidths=[330, 193])]
    pi = " | ".join(x for x in (p.get("name"), " / ".join(y for y in (p.get("age"), p.get("gender")) if y), p.get("phone"), p.get("email")) if x)
    loc = ", ".join(x for x in (p.get("city"), p.get("state"), p.get("pin")) if x)
    if pi or loc or p.get("emergency"): s.append(P("PATIENT DETAILS", H))
    if pi: s.append(P(pi))
    if loc: s.append(P(loc))
    if p.get("emergency"): s.append(P("Emergency contact: " + p["emergency"]))
    if v.get("allergies") or v.get("special"): s.append(P("ALLERGIES & SAFETY", H))
    if v.get("allergies"): s.append(P("Drug allergies: " + str(v["allergies"])))
    if v.get("special"): s.append(P("Special status: " + v["special"]))
    vit = [f"BP {v['bp']} mmHg" if v.get("bp") else "", f"Pulse {v['pulse']} bpm" if v.get("pulse") else "", f"SpO2 {v['spo2']}%" if v.get("spo2") else "",
           f"Temp {v['temp']}{v.get('tempUnit','')}" if v.get("temp") else "", f"Wt {v['weight']} kg" if v.get("weight") else "", f"Ht {v['height']} cm" if v.get("height") else ""]
    if v.get("ignore"): s += [P("VITALS", H), P("Vitals are confirmed as stated by patient.")]
    elif any(vit): s += [P(f"VITALS ({v.get('source','')})", H), P("   |   ".join(x for x in vit if x))]
    if any(c.get(k) for k in ("complaints", "onset", "hx", "dx", "notes")): s.append(P("CLINICAL PRESENTATION", H))
    if c.get("complaints"): s += [P("Chief complaints:", ParagraphStyle("b", parent=N, fontName="Helvetica-Bold"))] + bullets(c["complaints"])
    for k, lbl in (("onset", "Onset/duration"), ("hx", "History / current medications"), ("dx", "Provisional impression"), ("notes", "Assessment notes")):
        if c.get(k): s.append(Paragraph(f"<b>{lbl}:</b> " + esc(c[k]).replace("\n", "<br/>"), N))
    if d.get("inv"):
        s.append(P("DIAGNOSTIC INVESTIGATIONS", H)); s += [P(f"{i}. {x.get('name','')} [{x.get('status','')}] {x.get('instr','')}") for i, x in enumerate(d["inv"], 1)]
    s.append(P("PRESCRIPTION / MEDICATIONS", H))
    if d.get("meds"):
        rows = [["#", "Drug", "Strength", "Route", "Frequency", "Duration", "Instructions"]] + [[str(i), *[P(x.get(k, "")) for k in ("name", "strength", "route", "freq", "dur", "instr")]] for i, x in enumerate(d["meds"], 1)]
        t = Table(rows, repeatRows=1, colWidths=[18, 95, 55, 45, 70, 55, 185])
        t.setStyle(TableStyle([("GRID", (0, 0), (-1, -1), .4, colors.grey), ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#e6f4f1")), ("FONTSIZE", (0, 0), (-1, -1), 8), ("VALIGN", (0, 0), (-1, -1), "TOP")])); s.append(t)
    else: s.append(P("No medicines prescribed."))
    if any(a.get(k) for k in ("advice", "diet", "lifestyle", "counsel", "follow", "bring", "instr", "notes")):
        s.append(P("ADVICE & FOLLOW-UP", H)); s += bullets(a.get("advice", ""))
        for k, lbl in (("diet", "Diet"), ("lifestyle", "Lifestyle"), ("counsel", "Medication counselling"), ("bring", "Bring to follow-up"), ("instr", "Patient instructions")):
            if a.get(k): s.append(Paragraph(f"<b>{lbl}:</b> " + esc(a[k]).replace("\\n", "<br/>"), N))
        if a.get("follow"): s.append(P(f"Follow-up: {a['follow']} ({a.get('followMode','')})"))
        if a.get("notes"): s.append(P(a["notes"]))
    if a.get("flags"):
        box = Table([[Paragraph("<b>Emergency Red-Flag Warning</b><br/>" + esc(a["flags"]).replace("\n", "<br/>"), ParagraphStyle("f", parent=N, textColor=colors.HexColor("#9b1c1c")))]], colWidths=[523])
        box.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#fdecec")), ("BOX", (0, 0), (-1, -1), .6, colors.HexColor("#f3b4b4")), ("PADDING", (0, 0), (-1, -1), 8)])); s += [Spacer(1, 8), KeepTogether(box)]
    s.append(KeepTogether([Spacer(1, 40), Paragraph("______________________<br/>Doctor signature (not digitally signed)<br/>" + esc(g("doctor", "name")), ParagraphStyle("sg", parent=N, alignment=2, fontSize=8))]))
    doc.build(s); buf.seek(0); return buf

@app.get("/api/consultations/{cid}/pdf")
def pdf(cid: str):
    r = own(cid); d = json.loads(r["data"])
    return StreamingResponse(build_pdf(cid, d, r["status"]), media_type="application/pdf", headers={"Content-Disposition": f'attachment; filename="consultation-{cid}.pdf"'})
