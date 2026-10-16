import { useState, useEffect } from "react";
import { api } from "./api.js";
const nowIST = () => { const d = new Date(), o = { timeZone: "Asia/Kolkata" }; return { date: d.toLocaleDateString("en-CA", o), time: d.toLocaleTimeString("en-GB", { ...o, hour: "2-digit", minute: "2-digit" }) }; };
const newId = () => { const t = nowIST().date.replace(/-/g, ""); return `TC-${t}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`; };
const init = () => ({ id: newId(), doctor: { name: "", qual: "", reg: "", council: "", phone: "" }, meta: { ...nowIST(), mode: "Video Call", type: "First Consultation", followRef: "" },
  patient: { name: "", age: "", gender: "Male", phone: "", email: "", city: "", state: "", pin: "", emergency: "" },
  vitals: { source: "Patient-reported", bp: "", pulse: "", spo2: "", temp: "", tempUnit: "°F", weight: "", height: "", allergies: "", special: "" },
  clin: { complaints: "", onset: "", hx: "", dx: "", notes: "" }, inv: [], meds: [],
  adv: { advice: "", diet: "", follow: "", followMode: "Video Call", flags: "Seek immediate emergency care if symptoms worsen suddenly, or if you develop breathlessness at rest, chest pain or confusion.", notes: "" } });
const CSS = `*{box-sizing:border-box}body{margin:0;font:13px system-ui,sans-serif;color:#0f1f3d;background:#eef3f6}
.app{display:grid;grid-template-columns:150px 1fr 1fr;grid-template-rows:auto 1fr;height:100vh}
header{grid-column:1/4;display:flex;gap:10px;align-items:center;padding:8px 14px;background:#fff;border-bottom:1px solid #dbe4ea;flex-wrap:wrap}
header h1{font-size:16px;margin:0}header small{color:#5b6b80}.sp{flex:1}
button{cursor:pointer;border:1px solid #cdd8df;background:#fff;border-radius:7px;padding:7px 12px;font-weight:600;color:#0f1f3d}
button.p{background:#0f766e;color:#fff;border-color:#0f766e}button:disabled{opacity:.5;cursor:not-allowed}
nav{background:#fff;border-right:1px solid #dbe4ea;padding:8px;overflow:auto}nav button{display:block;width:100%;text-align:left;margin-bottom:6px;font-weight:500;font-size:12px}nav button.on{box-shadow:0 0 0 2px #0f766e66}nav button.done{background:#dcfce7;border-color:#16a34a;color:#166534}.ok{color:#16a34a}
main{overflow:auto;padding:12px}section{background:#f6f9fb;border:1px solid #dbe4ea;border-radius:10px;padding:10px 12px;margin-bottom:12px}
h2{font-size:12px;color:#0f5f58;margin:0 0 8px;text-transform:uppercase}.g{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px}
label{font-size:11px;font-weight:600;display:block}label.bad{color:#b91c1c}label.bad input,label.bad select,label.bad textarea{border-color:#dc2626;background:#fef2f2}.boxbad{border:1px solid #dc2626;background:#fef2f2;border-radius:8px;padding:6px}input,select,textarea{width:100%;padding:6px 8px;border:1px solid #cdd8df;border-radius:6px;font:inherit;background:#fff;margin-top:2px}
.er{color:#b91c1c;font-size:11px}textarea{min-height:56px;resize:vertical}table{width:100%;border-collapse:collapse;font-size:11px;margin-top:8px}td,th{border:1px solid #dbe4ea;padding:4px;text-align:left}
.pv{overflow:auto;padding:12px;background:#dde5ea}.tabs{display:none}.page{width:794px;min-height:1123px;background:#fff;padding:36px;position:relative;transform-origin:top left;border-top:6px solid #0f766e;box-shadow:0 2px 8px #0003}
.page h3{background:#e6f4f1;border-left:3px solid #0f766e;margin:12px 0 5px;padding:3px 8px;font-size:12px;color:#0f5f58}.page p{margin:2px 0;white-space:pre-wrap}.wm{position:absolute;top:45%;left:15%;font-size:90px;color:#0001;transform:rotate(-30deg);pointer-events:none}
.red{background:#fdecec;border:1px solid #f3b4b4;border-radius:8px;padding:8px;color:#9b1c1c;white-space:pre-wrap}.rt{color:#c81e1e;font-weight:700;margin:6px 0}.msg{padding:8px;border-radius:7px;margin:8px 0;background:#fff3cd}
@media(max-width:900px){.app{grid-template-columns:1fr;grid-template-rows:auto auto 1fr;height:auto}header,nav{grid-column:1}nav{display:flex;overflow:auto;gap:6px}nav button{width:auto;white-space:nowrap}.tabs{display:flex;gap:6px;padding:8px}.hide{display:none}.pv{overflow:auto}}`;
const sections = ["Consultation Details", "Patient Details", "Vitals & Safety", "Clinical Assessment", "Investigations", "Medications", "Advice & Follow-up", "Generate Report"];
const STATES = ["Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"];
const SEC = { date: 0, docName: 0, docReg: 0, name: 1, age: 1, phone: 1, city: 1, state: 1, allergies: 2, complaints: 3, dx: 3, inv: 4, meds: 5, advice: 6 };
const check = d => { const e = {}, p = d.patient, R = "Required";
  if (!d.meta.date) e.date = R; if (!d.doctor.name.trim()) e.docName = R; if (!d.doctor.reg.trim()) e.docReg = R;
  if (!p.name.trim()) e.name = R; if (!p.age.trim()) e.age = R; if (!/^\+\d{1,3}[\s-]?\d{6,12}$/.test(p.phone.trim())) e.phone = "Use +CC then number, e.g. +919876543210";
  if (!p.city.trim()) e.city = R; if (!p.state) e.state = "Select a state"; if (!d.vitals.allergies.trim()) e.allergies = "Required (write NKDA if none)";
  if (!d.clin.complaints.trim()) e.complaints = R; if (!d.clin.dx.trim()) e.dx = R;
  if (!d.inv.length && !d.invNone) e.inv = R; if (!d.meds.length && !d.medsNone) e.meds = R; if (!d.adv.advice.trim()) e.advice = R; return e; };
const F = ({ l, v, on, t = "text", o, r, err, ta, ph, id }) => <label className={err ? "bad" : ""}>{l}{r && " *"}
  {o ? <select id={id && "f-" + id} value={v} onChange={e => on(e.target.value)}>{o.map(x => <option key={x}>{x}</option>)}</select> : ta ? <textarea id={id && "f-" + id} value={v} placeholder={ph} onChange={e => on(e.target.value)} /> : <input id={id && "f-" + id} type={t} value={v} placeholder={ph} onChange={e => on(e.target.value)} />}
  {err && <span className="er">{err}</span>}</label>;
const Sec = ({ i, done, children }) => <section id={"s" + i}><h2>{i + 1}. {sections[i]} {done[i] && <span className="ok">✓</span>}</h2>{children}</section>;
function Rows({ rows, set, fields, addLabel, id, bad, none, setNone, noneLabel }) {
  const blank = Object.fromEntries(fields.map(f => [f.k, f.o ? f.o[0] : ""]));
  const [f, setF] = useState(blank), [ed, setEd] = useState(null);
  const ok = fields.filter(x => x.r).every(x => f[x.k].trim());
  const save = () => { if (!ok) return; set(ed === null ? [...rows, f] : rows.map((r, i) => i === ed ? f : r)); setF(blank); setEd(null); };
  return <div id={"f-" + id} className={bad ? "boxbad" : ""}><div className="g">{fields.map(x => <F key={x.k} l={x.l} r={x.r} o={x.o} v={f[x.k]} on={v => setF({ ...f, [x.k]: v })} />)}</div>
    <button className="p" style={{ marginTop: 8 }} disabled={!ok} onClick={save}>{ed === null ? addLabel : "Update"}</button>{ed !== null && <button onClick={() => { setF(blank); setEd(null); }}>Cancel</button>}
    <table><thead><tr><th>#</th>{fields.map(x => <th key={x.k}>{x.l}</th>)}<th>Action</th></tr></thead><tbody>
      {rows.map((r, i) => <tr key={i}><td>{i + 1}</td>{fields.map(x => <td key={x.k}>{r[x.k]}</td>)}<td><button onClick={() => { setF(r); setEd(i); }}>Edit</button><button onClick={() => { set(rows.filter((_, j) => j !== i)); if (ed === i) { setF(blank); setEd(null); } }}>Remove</button></td></tr>)}
      {!rows.length && <tr><td colSpan={fields.length + 2}>None added</td></tr>}</tbody></table>{!rows.length && <label style={{ display: "block", marginTop: 6 }}><input type="checkbox" style={{ width: "auto" }} checked={!!none} onChange={e => setNone(e.target.checked)} /> {noneLabel}</label>}{bad && <span className="er">Add at least one entry, or tick the box above</span>}</div>;
}
export default function App() {
  const [d, setD] = useState(() => JSON.parse(localStorage.getItem("tc_draft") || "null") || init());
  const [status, setStatus] = useState("Draft"), [msg, setMsg] = useState(""), [saved, setSaved] = useState(""), [showErr, setShowErr] = useState(false), [list, setList] = useState(null);
  const [tab, setTab] = useState("form"), [pv, setPv] = useState("A4"), [zoom, setZoom] = useState(0.75), [active, setActive] = useState(0), [busy, setBusy] = useState(false), [pdfReady, setPdfReady] = useState(false);
  const up = (s, k) => v => setD(p => ({ ...p, [s]: { ...p[s], [k]: v } }));
  useEffect(() => { const t = setTimeout(() => { localStorage.setItem("tc_draft", JSON.stringify(d)); setSaved("Auto-saved " + new Date().toLocaleTimeString()); }, 600); return () => clearTimeout(t); }, [d]);
  const errsAll = check(d), errs = showErr ? errsAll : {};
  const validate = () => { setShowErr(true); const keys = Object.keys(errsAll); if (!keys.length) return true;
    setMsg("Please fill the important fields marked in red."); setTab("form"); setActive(SEC[keys[0]]);
    setTimeout(() => { const el = document.getElementById("f-" + keys[0]); if (el) { el.scrollIntoView({ behavior: "smooth", block: "center" }); el.focus && el.focus({ preventScroll: true }); } }, 120); return false; };
  const saveServer = () => api("/api/consultations", "POST", { id: d.id, data: d });
  const saveDraft = async () => { localStorage.setItem("tc_draft", JSON.stringify(d)); try { await saveServer(); setMsg("Draft saved to server."); } catch (e) { setMsg(e.message); } };
  const genPdf = async () => {
    if (!validate()) return;
    try { await saveServer(); const b = await api(`/api/consultations/${d.id}/pdf`, "GET", null, true), u = URL.createObjectURL(b), a = document.createElement("a");
      a.href = u; a.download = `consultation-${d.id}.pdf`; a.click(); URL.revokeObjectURL(u); setStatus("Completed"); setPdfReady(true); setMsg("PDF generated by the server and downloaded."); } catch (e) { setMsg(e.message); } };
  const openList = async () => { try { setList(await api("/api/consultations")); } catch (e) { setMsg(e.message); } };
  const load = async id => { try { const j = await api("/api/consultations/" + id); setD(j.data); setStatus(j.status); setList(null); setShowErr(false); setPdfReady(false); setMsg("Opened " + id); } catch (e) { setMsg(e.message); } };
  const del = async id => { if (confirm("Delete this consultation permanently?")) { try { await api("/api/consultations/" + id, "DELETE"); openList(); } catch (e) { setMsg(e.message); } } };
  const newConsult = () => { if (confirm("Start a new consultation? Current form will be cleared.")) { localStorage.removeItem("tc_draft"); setStatus("Draft"); setPdfReady(false); setShowErr(false); setD({ ...init(), doctor: d.doctor }); setMsg("New consultation started with a new reference ID."); window.scrollTo(0, 0); go(0); } };
  const ok = (...k) => k.every(x => !errsAll[x]);
  const done = [ok("date", "docName", "docReg"), ok("name", "age", "phone", "city", "state"), ok("allergies"), ok("complaints", "dx"), ok("inv"), ok("meds"), ok("advice"), status === "Completed"];
  const go = i => { setActive(i); setTab("form"); document.getElementById("s" + i)?.scrollIntoView({ behavior: "smooth", block: "start" }); };
  const p = d.patient, v = d.vitals, a = d.adv;
  const lines = t => t.split("\n").filter(x => x.trim());
  return <div className="app"><style>{CSS}</style>
    <header><span style={{ fontSize: 24 }}>🩺</span><div><h1>Teleconsultation Engine</h1><small>NMC-Compliant Dynamic Prescription Generator</small></div><span className="sp" /><small>☁ {saved}</small>
      <button onClick={newConsult}>＋ New</button><button onClick={openList}>My Consultations</button><button onClick={saveDraft}>Save Draft</button><button onClick={() => { setPv("A4"); setTab("preview"); }}>Preview</button>
      <button className="p" onClick={genPdf}>Generate A4 PDF</button></header>
    <nav>{sections.map((s, i) => <button key={s} className={(active === i ? "on " : "") + (done[i] ? "done" : "")} onClick={() => go(i)}>{i + 1}. {s} {done[i] && <span className="ok">✓</span>}</button>)}</nav>
    <div className="hide-wrap" style={{ display: "contents" }}>
      <div className="tabs" style={{ gridColumn: 1 }}><button className={tab === "form" ? "p" : ""} onClick={() => setTab("form")}>Form</button><button className={tab === "preview" ? "p" : ""} onClick={() => setTab("preview")}>Preview</button></div>
      <main className={tab === "preview" ? "hide" : ""}>
        {msg && <div className="msg">{msg}</div>}
        {list && <section><h2>My consultations <button onClick={() => setList(null)} style={{ float: "right" }}>Close</button></h2><table><thead><tr><th>Ref</th><th>Patient</th><th>Date</th><th>Status</th><th>Action</th></tr></thead><tbody>
          {list.map(r => <tr key={r.id}><td>{r.id}</td><td>{r.patient}</td><td>{r.date}</td><td>{r.status}</td><td><button onClick={() => load(r.id)}>Open</button><button onClick={() => del(r.id)}>Delete</button></td></tr>)}{!list.length && <tr><td colSpan={5}>No saved consultations yet</td></tr>}</tbody></table></section>}
        <Sec i={0} done={done}><div className="g"><F l="Ref ID" v={d.id} on={() => {}} /><F l="Date" t="date" r id="date" v={d.meta.date} on={up("meta", "date")} err={errs.date} /><F l="Time" t="time" v={d.meta.time} on={up("meta", "time")} />
          <F l="Mode" o={["Video Call", "Audio Call", "In-Person"]} v={d.meta.mode} on={up("meta", "mode")} /><F l="Type" o={["First Consultation", "Follow-up Consultation"]} v={d.meta.type} on={up("meta", "type")} />
          {d.meta.type.startsWith("Follow") && <F l="Follow-up of Ref" v={d.meta.followRef} on={up("meta", "followRef")} />}<F l="Status" v={status} on={() => {}} /></div>
          <h2 style={{ marginTop: 10 }}>Doctor</h2><div className="g"><F l="Name" r id="docName" v={d.doctor.name} on={up("doctor", "name")} err={errs.docName} /><F l="Qualifications" v={d.doctor.qual} on={up("doctor", "qual")} /><F l="Reg. No" r id="docReg" v={d.doctor.reg} on={up("doctor", "reg")} err={errs.docReg} /><F l="Issuing authority" v={d.doctor.council} on={up("doctor", "council")} /><F l="Contact" v={d.doctor.phone} on={up("doctor", "phone")} /></div></Sec>
        <Sec i={1} done={done}><div className="g"><F l="Full name" r id="name" v={p.name} on={up("patient", "name")} err={errs.name} /><F l="Age / DOB" r id="age" v={p.age} on={up("patient", "age")} err={errs.age} ph="66 Years" /><F l="Gender" o={["Male", "Female", "Other"]} v={p.gender} on={up("patient", "gender")} />
          <F l="Phone" r id="phone" v={p.phone} on={up("patient", "phone")} err={errs.phone} ph="+91 9876543210" /><F l="Email (optional)" v={p.email} on={up("patient", "email")} /><F l="City" r id="city" v={p.city} on={up("patient", "city")} err={errs.city} /><F l="State" r id="state" o={["Select state", ...STATES]} v={p.state || "Select state"} on={x => up("patient", "state")(x === "Select state" ? "" : x)} err={errs.state} /><F l="PIN" v={p.pin} on={up("patient", "pin")} /><F l="Emergency contact" v={p.emergency} on={up("patient", "emergency")} /></div></Sec>
        <Sec i={2} done={done}><div className="g"><F l="Data source" o={["Patient-reported", "Clinician-measured", "Not provided", "Unknown", "Confirmed negative"]} v={v.source} on={up("vitals", "source")} /><F l="BP (mmHg)" v={v.bp} on={up("vitals", "bp")} ph="120/80" /><F l="Pulse (bpm)" v={v.pulse} on={up("vitals", "pulse")} /><F l="SpO2 (%)" v={v.spo2} on={up("vitals", "spo2")} />
          <F l="Temp" v={v.temp} on={up("vitals", "temp")} /><F l="Unit" o={["°C", "°F"]} v={v.tempUnit} on={up("vitals", "tempUnit")} /><F l="Weight (kg)" v={v.weight} on={up("vitals", "weight")} /><F l="Height (cm)" v={v.height} on={up("vitals", "height")} /></div>
          <div className="g" style={{ marginTop: 8 }}><F l="Known drug allergies" r id="allergies" v={v.allergies} on={up("vitals", "allergies")} ph="e.g. NKDA" err={errs.allergies} /><F l="Special status (Preg/Lact/Renal)" v={v.special} on={up("vitals", "special")} /></div></Sec>
        <Sec i={3} done={done}><F l="Chief complaints (one per line)" r ta id="complaints" v={d.clin.complaints} on={up("clin", "complaints")} err={errs.complaints} /><F l="Onset & duration" v={d.clin.onset} on={up("clin", "onset")} />
          <F l="Past history & current medications" ta v={d.clin.hx} on={up("clin", "hx")} /><F l="Provisional diagnosis / clinical impression" r ta id="dx" v={d.clin.dx} on={up("clin", "dx")} err={errs.dx} /><F l="Assessment notes" ta v={d.clin.notes} on={up("clin", "notes")} /></Sec>
        <Sec i={4} done={done}><Rows rows={d.inv} set={x => setD(p => ({ ...p, inv: x }))} addLabel="Add Investigation" id="inv" bad={!!errs.inv} none={d.invNone} setNone={x => setD(p => ({ ...p, invNone: x }))} noneLabel="No investigations required" fields={[{ k: "name", l: "Investigation", r: 1 }, { k: "cat", l: "Category", o: ["Laboratory", "Imaging", "Cardiac", "Other"] }, { k: "status", l: "Status", o: ["Advised", "Ordered", "Completed", "Result Pending"] }, { k: "instr", l: "Instructions" }]} /></Sec>
        <Sec i={5} done={done}><Rows rows={d.meds} set={x => setD(p => ({ ...p, meds: x }))} addLabel="Add Drug" id="meds" bad={!!errs.meds} none={d.medsNone} setNone={x => setD(p => ({ ...p, medsNone: x }))} noneLabel="No medicines prescribed" fields={[{ k: "name", l: "Medicine", r: 1 }, { k: "strength", l: "Strength", r: 1 }, { k: "route", l: "Route", o: ["Oral", "Topical", "Inhalation", "Injection", "Other"] }, { k: "freq", l: "Frequency", r: 1 }, { k: "dur", l: "Duration", r: 1 }, { k: "instr", l: "Instructions" }]} />
          {!d.meds.length && <small>No medicines will be shown on the record as prescribed.</small>}</Sec>
        <Sec i={6} done={done}><div className="g"><F l="Clinical advice (one per line)" r ta id="advice" v={a.advice} on={up("adv", "advice")} err={errs.advice} /><F l="Dietary advice" ta v={a.diet} on={up("adv", "diet")} /></div>
          <div className="g"><F l="Follow-up date" t="date" v={a.follow} on={up("adv", "follow")} /><F l="Follow-up mode" o={["Video Call", "Audio Call", "In-Person"]} v={a.followMode} on={up("adv", "followMode")} /></div>
          <label style={{ marginTop: 8, color: "#b91c1c" }}>Emergency red-flag warning (editable)<textarea style={{ background: "#fdecec" }} value={a.flags} onChange={e => up("adv", "flags")(e.target.value)} /></label><F l="Additional notes" ta v={a.notes} on={up("adv", "notes")} /></Sec>
        <Sec i={7} done={done}><p><b>{d.id}</b> • {p.name || "—"} • Status: <b>{status}</b></p><small>Fill the required fields (*), then generate. The record is saved to your account and the PDF is generated by the server.</small>
          <div style={{ marginTop: 8 }}><button className="p" onClick={genPdf}>Generate A4 PDF</button>{pdfReady && <span> Downloaded ✓</span>}<button onClick={newConsult}>Start new consultation</button></div></Sec>
      </main>
      <div className={"pv " + (tab === "form" ? "hide" : "")}>
        <div style={{ display: "flex", gap: 6, marginBottom: 8 }}><button className={pv === "A4" ? "p" : ""} onClick={() => setPv("A4")}>A4 Preview</button><button className={pv === "D" ? "p" : ""} onClick={() => setPv("D")}>Data Summary</button><button className="p" onClick={genPdf}>⬇ Download PDF</button><span className="sp" style={{ flex: 1 }} />
          <button onClick={() => setZoom(z => Math.max(.4, z - .1))}>−</button><b style={{ padding: 6 }}>{Math.round(zoom * 100)}%</b><button onClick={() => setZoom(z => Math.min(1.2, z + .1))}>+</button></div>
        {pv === "D" ? <pre style={{ background: "#fff", padding: 10, whiteSpace: "pre-wrap" }}>{JSON.stringify(d, null, 2)}</pre> :
          <div style={{ width: 794 * zoom, height: 1123 * zoom }}><div className="page" style={{ transform: `scale(${zoom})` }}>
            {status !== "Completed" && <div className="wm">DRAFT</div>}<b style={{ color: "#0f766e" }}>TELECONSULTATION RECORD</b>
            <div style={{ float: "right", textAlign: "right", fontSize: 11 }}>Date: {d.meta.date} {d.meta.time}<br />Ref: {d.id}<br />{d.meta.type} ({d.meta.mode}){d.meta.followRef && <><br />Follow-up of {d.meta.followRef}</>}</div>
            <h1 style={{ margin: "6px 0" }}>{d.doctor.name || "Doctor name"} <span style={{ color: "#0f766e" }}>{d.doctor.qual}</span></h1>
            <div style={{ fontSize: 11 }}>Reg. No: {d.doctor.reg || "—"} {d.doctor.council && `(${d.doctor.council})`} {d.doctor.phone && ` • ${d.doctor.phone}`}</div>
            <h3>PATIENT DETAILS</h3><p>{p.name || "—"} • {p.age} / {p.gender} • {p.phone}{p.email && ` • ${p.email}`}{"\n"}{[p.city, p.state, p.pin].filter(Boolean).join(", ")}{p.emergency && `\nEmergency contact: ${p.emergency}`}</p>
            {(v.allergies || v.special) && <><h3>ALLERGIES & SAFETY</h3><p>{v.allergies && `Drug allergies: ${v.allergies}\n`}{v.special && `Special status: ${v.special}`}</p></>}
            {(v.bp || v.pulse || v.spo2 || v.temp || v.weight) && <><h3>VITALS ({v.source})</h3><p>{[v.bp && `BP ${v.bp} mmHg`, v.pulse && `Pulse ${v.pulse} bpm`, v.spo2 && `SpO2 ${v.spo2}%`, v.temp && `Temp ${v.temp}${v.tempUnit}`, v.weight && `Wt ${v.weight} kg`, v.height && `Ht ${v.height} cm`].filter(Boolean).join("  •  ")}</p></>}
            {d.clin.complaints && <><h3>CLINICAL PRESENTATION</h3><p><b>Complaints:</b>{"\n"}{lines(d.clin.complaints).map(l => "• " + l).join("\n")}{d.clin.onset && `\nOnset/duration: ${d.clin.onset}`}</p>{d.clin.hx && <p><b>History / current medications:</b>{"\n"}{d.clin.hx}</p>}{d.clin.dx && <p><b>Provisional impression:</b>{"\n"}{d.clin.dx}</p>}{d.clin.notes && <p><b>Notes:</b> {d.clin.notes}</p>}</>}
            {d.inv.length > 0 && <><h3>DIAGNOSTIC INVESTIGATIONS</h3>{d.inv.map((x, i) => <p key={i}>{i + 1}. {x.name} <i>[{x.status}]</i> {x.instr}</p>)}</>}
            <h3>PRESCRIPTION / MEDICATIONS</h3>{d.meds.length ? <table><thead><tr>{["#", "Drug", "Strength", "Route", "Frequency", "Duration", "Instructions"].map(h => <th key={h}>{h}</th>)}</tr></thead><tbody>{d.meds.map((m, i) => <tr key={i}><td>{i + 1}</td><td>{m.name}</td><td>{m.strength}</td><td>{m.route}</td><td>{m.freq}</td><td>{m.dur}</td><td>{m.instr}</td></tr>)}</tbody></table> : <p>No medicines prescribed.</p>}
            {(a.advice || a.diet || a.follow) && <><h3>ADVICE & FOLLOW-UP</h3>{a.advice && <p>{lines(a.advice).map(l => "• " + l).join("\n")}</p>}{a.diet && <p><b>Diet:</b> {a.diet}</p>}{a.follow && <p><b>Follow-up:</b> {a.follow} ({a.followMode})</p>}{a.notes && <p>{a.notes}</p>}</>}
            {a.flags && <div className="red" style={{ marginTop: 10 }}><b>⚠ Emergency Red-Flag Warning</b>{"\n"}{a.flags}</div>}
            <div style={{ marginTop: 50, textAlign: "right", fontSize: 11 }}>______________________<br />Doctor signature (not digitally signed)<br />{d.doctor.name}</div>
            <div style={{ position: "absolute", bottom: 14, left: 36, right: 36, fontSize: 9, color: "#667" }}>Teleconsultation record • Not a substitute for in-person evaluation <span style={{ float: "right" }}>Page 1 / 1</span></div>
          </div></div>}
      </div></div></div>;
}
