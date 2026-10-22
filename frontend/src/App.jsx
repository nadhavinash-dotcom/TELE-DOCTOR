import { useState, useEffect } from "react";
import { api } from "./api.js";
const nowIST = () => { const d = new Date(), o = { timeZone: "Asia/Kolkata" }; return { date: d.toLocaleDateString("en-CA", o), time: d.toLocaleTimeString("en-GB", { ...o, hour: "2-digit", minute: "2-digit" }) }; };
const newId = () => { const t = nowIST().date.replace(/-/g, ""); return `TC-${t}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`; };
const init = () => ({ id: newId(), doctor: { name: "Dr. Madhusudhan", qual: "MBBS", spec: "General Physician | Registered Medical Practitioner", reg: "APMC/FMR/111849", council: "Andhra Pradesh Medical Council", phone: "+91 9381353748" }, meta: { ...nowIST(), mode: "Video Call", type: "First Consultation", followRef: "", status: "Draft" },
  patient: { name: "", age: "", gender: "", phone: "", email: "", city: "", state: "", pin: "", emergency: "" },
  vitals: { ignore: false, source: "Patient-reported", bp: "", pulse: "", spo2: "", temp: "", tempUnit: "°F", weight: "", height: "", allergies: "", special: "" },
  clin: { complaints: "", onset: "", hx: "", dx: "", notes: "" }, inv: [], meds: [],
  adv: { advice: "", diet: "", lifestyle: "", counsel: "", follow: "", followMode: "Video Call", bring: "", instr: "", flags: "Seek immediate emergency care if symptoms worsen suddenly, or if you develop breathlessness at rest, chest pain or confusion.", notes: "" } });
const hydrate = x => { const b = init(); if (!x) return b; const dd = {}; for (const k in b.doctor) dd[k] = (x.doctor && x.doctor[k]) || b.doctor[k];
  return { ...b, ...x, id: x.id || b.id, doctor: dd, meta: { ...b.meta, ...x.meta }, patient: { ...b.patient, ...x.patient }, vitals: { ...b.vitals, ...x.vitals }, clin: { ...b.clin, ...x.clin }, adv: { ...b.adv, ...x.adv }, inv: x.inv || [], meds: x.meds || [] }; };
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
input[readonly]{background:#eef3f6}.toast{position:fixed;bottom:16px;left:50%;transform:translateX(-50%);background:#0f1f3d;color:#fff;padding:10px 16px;border-radius:8px;z-index:50;max-width:90vw;cursor:pointer;box-shadow:0 4px 14px #0004}@media print{@page{size:A4;margin:8mm}header,nav,.tabs,main,.pvbar,.toast{display:none!important}.app{display:block;height:auto}.pv{display:block!important;overflow:visible;padding:0;background:#fff}.pv>div{width:auto!important;height:auto!important}.page{transform:none!important;box-shadow:none;width:100%;min-height:0}}.er{color:#b91c1c;font-size:11px}textarea{min-height:56px;resize:vertical}table{width:100%;border-collapse:collapse;font-size:11px;margin-top:8px}td,th{border:1px solid #dbe4ea;padding:4px;text-align:left}
.pv{overflow:auto;padding:12px;background:#dde5ea}.tabs{display:none}.page{width:794px;min-height:1123px;background:#fff;padding:36px;position:relative;transform-origin:top left;border-top:6px solid #0f766e;box-shadow:0 2px 8px #0003}
.page h3{background:#e6f4f1;border-left:3px solid #0f766e;margin:12px 0 5px;padding:3px 8px;font-size:12px;color:#0f5f58}.page p{margin:2px 0;white-space:pre-wrap}.wm{position:absolute;top:45%;left:15%;font-size:90px;color:#0001;transform:rotate(-30deg);pointer-events:none}
.red{background:#fdecec;border:1px solid #f3b4b4;border-radius:8px;padding:8px;color:#9b1c1c;white-space:pre-wrap}.rt{color:#c81e1e;font-weight:700;margin:6px 0}.msg{padding:8px;border-radius:7px;margin:8px 0;background:#fff3cd}
@media(max-width:900px){.app{grid-template-columns:1fr;grid-template-rows:auto auto 1fr;height:auto}header,nav{grid-column:1}nav{display:flex;overflow:auto;gap:6px}nav button{width:auto;white-space:nowrap}.tabs{display:flex;gap:6px;padding:8px}.hide{display:none}.pv{overflow:auto}}`;
const sections = ["Consultation Details", "Patient Details", "Vitals & Safety", "Clinical Assessment", "Investigations", "Medications", "Advice & Follow-up", "Generate Report"];
const I = n => ({ name: n, cat: "Laboratory", status: "Advised", instr: "" });
const M = (name, strength, freq, dur, instr) => ({ name, strength, route: "Oral", freq, dur, instr });
const PRESETS = {
  anitha: { label: "Mrs. Anitha (Fever & HTN)", color: "#0f766e", followDays: 1, data: { patient: { name: "B. Anitha", age: "49 Yrs", gender: "Female", phone: "+91 9494235764", city: "Atapur, Hyderabad", state: "Telangana" }, vitals: { bp: "140/100", pulse: "100", spo2: "98", temp: "99", tempUnit: "°F", allergies: "NKDA (No Known Drug Allergies)" },
    clin: { complaints: "Fever\nCough\nCold", onset: "Since 4 days", hx: "Known case of Hypertension on medication (Tab. Telmikind-H)", dx: "Fever for evaluation, uncontrolled Hypertension", notes: "Stop using Tab. Telmikind H. Start revised prescription immediately." },
    inv: [I("Hemogram with Peripheral Smear for Malarial Parasite"), I("NS1 Antigen test"), I("Lipid Profile"), I("Thyroid Profile"), I("ECG, 2D Echo")],
    meds: [M("Tab. Cilaheart", "10 mg", "Morning", "10 days", "After Breakfast"), M("Tab. Calpol", "500 mg", "Morning and Night", "5 days", "After Food"), M("Tab. Levocet", "5 mg", "Morning and Night", "5 days", "After Food"), M("Tab. Amoxyclav", "625 mg", "Morning and Night", "5 days", "After Food")],
    adv: { advice: "Brisk walking for 45 minutes daily; practice meditation for stress reduction.\nRecord Blood Pressure readings for 2 consecutive days post-breakfast and report.", diet: "Strictly reduce salt intake; avoid oily, greasy, and fried foods.", bring: "All advised investigation reports.", instr: "Follow up as soon as blood investigation reports are ready." } } },
  viral: { label: "Viral Fever & Cold", color: "#1d4ed8", followDays: 3, data: { patient: { name: "Rahul Sharma", age: "35 Years", gender: "Male", phone: "+91 9876543210", city: "Gachibowli, Hyderabad", state: "Telangana" }, vitals: { bp: "120/80", pulse: "80", temp: "101", tempUnit: "°F", allergies: "No known drug allergies" },
    clin: { complaints: "High fever and body aches\nRunny nose and sore throat", onset: "Since 2 days", hx: "No known chronic illnesses", dx: "Acute viral fever" }, inv: [I("Complete Blood Picture (CBC) with ESR"), I("Malaria Rapid Antigen Test")],
    meds: [M("Tab. Paracetamol", "650 mg", "Thrice daily (if fever)", "3 days", "After Food"), M("Tab. Cetirizine", "10 mg", "Once daily at night", "5 days", "After Food")],
    adv: { advice: "Take adequate rest.\nSteam inhalation twice daily.", diet: "Plenty of warm fluids; light home-cooked food.", instr: "Review if fever persists beyond 3 days." } } },
  diabetes: { label: "Diabetes Follow-up", color: "#d97706", type: "Follow-up Consultation", followDays: 30, data: { patient: { name: "Sneha Reddy", age: "52 Years", gender: "Female", phone: "+91 9812345670", city: "Kukatpally, Hyderabad", state: "Telangana" }, vitals: { bp: "130/80", pulse: "78", allergies: "No known drug allergies" },
    clin: { complaints: "Routine diabetes follow-up\nOccasional fatigue", onset: "Ongoing", hx: "Known case of Type 2 Diabetes Mellitus on Tab. Metformin", dx: "Type 2 Diabetes Mellitus - follow-up" }, inv: [I("HbA1c"), I("Fasting & Post-prandial Blood Sugar"), I("Lipid Profile"), I("Renal Function Test"), I("Urine Routine")],
    meds: [M("Tab. Metformin", "500 mg", "Twice daily", "30 days", "After Food")], adv: { advice: "Monitor fasting blood sugar weekly.\nDaily foot care and inspection.", diet: "Low sugar, high fibre diet; avoid sweets and refined carbs.", lifestyle: "Walk 30-45 minutes daily.", bring: "Blood sugar log and latest reports." } } },
  htn: { label: "Hypertension Review", color: "#7c3aed", type: "Follow-up Consultation", followDays: 14, data: { patient: { name: "Rakesh Kumar", age: "58 Years", gender: "Male", phone: "+91 9700011223", city: "Secunderabad", state: "Telangana" }, vitals: { bp: "150/95", pulse: "84", allergies: "No known drug allergies" },
    clin: { complaints: "Occasional headache\nRoutine BP review", onset: "Since 1 week", hx: "Known case of Hypertension", dx: "Hypertension - review" }, inv: [I("Renal Function Test"), I("Lipid Profile"), I("ECG")],
    meds: [M("Tab. Amlodipine", "5 mg", "Once daily", "Continue", "Morning, after Food")], adv: { advice: "Record BP twice daily and bring the log.", diet: "Restrict salt to less than 5 g/day.", lifestyle: "Regular walking; avoid smoking and alcohol." } } },
  gastric: { label: "Acidity & Gastritis", color: "#be185d", followDays: 7, data: { patient: { name: "Priya Nair", age: "30 Years", gender: "Female", phone: "+91 9000011223", city: "Madhapur, Hyderabad", state: "Telangana" }, vitals: { allergies: "No known drug allergies" },
    clin: { complaints: "Burning sensation in upper abdomen\nBloating after meals", onset: "Since 5 days", hx: "No chronic illnesses", dx: "Acute gastritis" }, inv: [I("H. pylori Stool Antigen")],
    meds: [M("Tab. Pantoprazole", "40 mg", "Once daily", "14 days", "Before Breakfast")], adv: { advice: "Avoid lying down within 2 hours of meals.", diet: "Avoid spicy, oily food, tea and coffee on an empty stomach." } } },
  other: { label: "Other (blank form)", color: "#475569", data: {} }
};
const STATES = ["Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"];
const F = ({ l, v, on, t = "text", o, r, err, ta, ph, id, ro }) => <label className={err ? "bad" : ""}>{l}{r && " *"}
  {o ? <select id={id && "f-" + id} value={v} onChange={e => on(e.target.value)}>{o.map(x => <option key={x} value={x}>{x || "— Not specified —"}</option>)}</select> : ta ? <textarea id={id && "f-" + id} value={v} placeholder={ph} onChange={e => on(e.target.value)} /> : <input id={id && "f-" + id} readOnly={ro} type={t} value={v} placeholder={ph} onChange={e => on(e.target.value)} />}
  {err && <span className="er">{err}</span>}</label>;
const Sec = ({ i, done, children }) => <section id={"s" + i}><h2>{i + 1}. {sections[i]} {done[i] && <span className="ok">✓</span>}</h2>{children}</section>;
function Rows({ rows, set, fields, addLabel }) {
  const blank = Object.fromEntries(fields.map(f => [f.k, f.o ? f.o[0] : ""]));
  const [f, setF] = useState(blank), [ed, setEd] = useState(null);
  const ok = fields.filter(x => x.r).every(x => f[x.k].trim());
  const save = () => { if (!ok) return; set(ed === null ? [...rows, f] : rows.map((r, i) => i === ed ? f : r)); setF(blank); setEd(null); };
  return <div><div className="g">{fields.map(x => <F key={x.k} l={x.l} o={x.o} v={f[x.k]} on={v => setF({ ...f, [x.k]: v })} />)}</div>
    <button className="p" style={{ marginTop: 8 }} disabled={!ok} onClick={save}>{ed === null ? addLabel : "Update"}</button>{ed !== null && <button onClick={() => { setF(blank); setEd(null); }}>Cancel</button>}
    <table><thead><tr><th>#</th>{fields.map(x => <th key={x.k}>{x.l}</th>)}<th>Action</th></tr></thead><tbody>
      {rows.map((r, i) => <tr key={i}><td>{i + 1}</td>{fields.map(x => <td key={x.k}>{r[x.k]}</td>)}<td><button onClick={() => { setF(r); setEd(i); }}>Edit</button><button onClick={() => { set(rows.filter((_, j) => j !== i)); if (ed === i) { setF(blank); setEd(null); } }}>Remove</button></td></tr>)}
      {!rows.length && <tr><td colSpan={fields.length + 2}>None added</td></tr>}</tbody></table></div>;
}
export default function App() {
  const [d, setD] = useState(() => (() => { try { } catch {} return init(); })());
  const [msg, setMsg] = useState(""), [saved, setSaved] = useState(""), [list, setList] = useState(null), [preset, setPreset] = useState("");
  const [tab, setTab] = useState("form"), [pv, setPv] = useState("A4"), [zoom, setZoom] = useState(0.75), [active, setActive] = useState(0), [busy, setBusy] = useState(false), [pdfReady, setPdfReady] = useState(false);
  const status = d.meta.status || "Draft";
  const up = (s, k) => v => setD(p => ({ ...p, [s]: { ...p[s], [k]: v } }));
  useEffect(() => { if (!msg) return; const t = setTimeout(() => setMsg(""), 7000); return () => clearTimeout(t); }, [msg]);
  const applyPreset = key => { const base = init(), pr = PRESETS[key].data, fd = PRESETS[key].followDays;
    setD(prev => ({ ...base, id: prev.id, doctor: prev.doctor, meta: { ...prev.meta, type: PRESETS[key].type || "First Consultation", followRef: "" }, patient: { ...base.patient, ...pr.patient }, vitals: { ...base.vitals, ...pr.vitals }, clin: { ...base.clin, ...pr.clin }, inv: pr.inv || [], meds: pr.meds || [],
      adv: { ...base.adv, ...pr.adv, follow: fd ? new Date(Date.now() + fd * 864e5).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }) : "" } }));
    setPreset(key); setMsg(key === "other" ? "Blank form. Please fill in everything." : `"${PRESETS[key].label}" loaded. Review and edit the details before saving.`); };
  const saveServer = () => api("/api/consultations", "POST", { id: d.id, data: d });
  const saveDraft = async () => { try { await saveServer(); setSaved("Saved " + new Date().toLocaleTimeString()); setMsg("Draft saved."); } catch (e) { setMsg(e.message); } };
  const genPdf = async () => {
    setMsg("Generating PDF…");
    try {
      await saveServer();
      const b = await api(`/api/consultations/${d.id}/pdf`, "GET", null, true);
      if (!b.size) throw new Error("Server returned an empty PDF");
      const u = URL.createObjectURL(b), a = document.createElement("a"); a.href = u; a.download = `consultation-${d.id}.pdf`; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(u), 10000); setPdfReady(true); setMsg("PDF downloaded.");
    } catch (e) { // server unavailable -> fall back to the browser's own "Save as PDF"
      setMsg(e.message + " Opening the print dialog: choose 'Save as PDF'."); setPv("A4"); setTab("preview"); setTimeout(() => window.print(), 700);
    }
  };
  const openList = async () => { try { setList(await api("/api/consultations")); } catch (e) { setMsg(e.message); } };
  const load = async id => { try { const j = await api("/api/consultations/" + id); setD(hydrate(j.data)); setList(null); setPdfReady(false); setMsg("Opened " + id); } catch (e) { setMsg(e.message); } };
  const del = async id => { if (confirm("Delete this consultation permanently?")) { try { await api("/api/consultations/" + id, "DELETE"); openList(); } catch (e) { setMsg(e.message); } } };
  const newConsult = () => { if (confirm("Start a new consultation? Current form will be cleared.")) { setPdfReady(false); setD({ ...init(), doctor: d.doctor }); setMsg("New consultation started with a new reference ID."); window.scrollTo(0, 0); go(0); } };
  const p = d.patient, v = d.vitals, a = d.adv;
  const has = (...x) => x.some(y => String(y || "").trim());
  const done = [true, has(p.name, p.age, p.phone, p.city, p.state, p.email, p.pin, p.emergency), v.ignore || has(v.bp, v.pulse, v.spo2, v.temp, v.weight, v.height, v.allergies, v.special), has(d.clin.complaints, d.clin.onset, d.clin.hx, d.clin.dx, d.clin.notes), d.inv.length > 0, d.meds.length > 0, has(a.advice, a.diet, a.lifestyle, a.counsel, a.follow, a.bring, a.instr, a.notes), status === "Complete"];
  const go = i => { setActive(i); setTab("form"); document.getElementById("s" + i)?.scrollIntoView({ behavior: "smooth", block: "start" }); };
  const lines = t => t.split("\n").filter(x => x.trim());
  return <div className="app"><style>{CSS}</style>{msg && <div className="toast" onClick={() => setMsg("")}>{msg}</div>}
    <header><span style={{ fontSize: 24 }}>🩺</span><div><h1>Teleconsultation Engine</h1><small>NMC-Compliant Dynamic Prescription Generator</small></div><span className="sp" /><small>☁ {saved}</small>
      <button onClick={newConsult}>＋ New</button><button onClick={openList}>My Consultations</button><button onClick={saveDraft}>Save Draft</button><button onClick={() => { setPv("A4"); setTab("preview"); }}>Preview</button>
      <button className="p" onClick={genPdf}>Generate A4 PDF</button></header>
    <nav>{sections.map((s, i) => <button key={s} className={(active === i ? "on " : "") + (done[i] ? "done" : "")} onClick={() => go(i)}>{i + 1}. {s} {done[i] && <span className="ok">✓</span>}</button>)}</nav>
    <div className="hide-wrap" style={{ display: "contents" }}>
      <div className="tabs" style={{ gridColumn: 1 }}><button className={tab === "form" ? "p" : ""} onClick={() => setTab("form")}>Form</button><button className={tab === "preview" ? "p" : ""} onClick={() => setTab("preview")}>Preview</button></div>
      <main className={tab === "preview" ? "hide" : ""}>
        <section style={{ background: "#ecfdf5", borderColor: "#a7f3d0" }}><h2>⚡ 1-Tap Presets (fills the form instantly)</h2><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {Object.entries(PRESETS).map(([k, x]) => <button key={k} onClick={() => applyPreset(k)} style={{ background: x.color, color: "#fff", border: preset === k ? "3px solid #0f1f3d" : "1px solid transparent" }}>{x.label}</button>)}</div></section>
                {list && <section><h2>My consultations <button onClick={() => setList(null)} style={{ float: "right" }}>Close</button></h2><table><thead><tr><th>Ref</th><th>Patient</th><th>Date</th><th>Status</th><th>Action</th></tr></thead><tbody>
          {list.map(r => <tr key={r.id}><td>{r.id}</td><td>{r.patient}</td><td>{r.date}</td><td>{r.status}</td><td><button onClick={() => load(r.id)}>Open</button><button onClick={() => del(r.id)}>Delete</button></td></tr>)}{!list.length && <tr><td colSpan={5}>No saved consultations yet</td></tr>}</tbody></table></section>}
        <Sec i={0} done={done}><div className="g"><F l="Ref ID (auto)" ro v={d.id} on={() => {}} /><F l="Date (auto)" t="date" ro id="date" v={d.meta.date} on={up("meta", "date")} /><F l="Time (auto)" t="time" ro v={d.meta.time} on={up("meta", "time")} />
          <F l="Mode" o={["Video Call", "Audio Call", "In-Person"]} v={d.meta.mode} on={up("meta", "mode")} /><F l="Type" o={["First Consultation", "Follow-up Consultation"]} v={d.meta.type} on={up("meta", "type")} />
          {d.meta.type.startsWith("Follow") && <F l="Follow-up of Ref" v={d.meta.followRef} on={up("meta", "followRef")} />}<F l="Status" o={["Draft", "Complete"]} v={status} on={up("meta", "status")} /></div>
          <h2 style={{ marginTop: 10 }}>Doctor</h2><div className="g"><F l="Name" id="docName" v={d.doctor.name} on={up("doctor", "name")} /><F l="Qualifications" v={d.doctor.qual} on={up("doctor", "qual")} /><F l="Specialty / designation" v={d.doctor.spec} on={up("doctor", "spec")} /><F l="Reg. No" id="docReg" v={d.doctor.reg} on={up("doctor", "reg")} /><F l="Issuing authority" v={d.doctor.council} on={up("doctor", "council")} /><F l="Contact" v={d.doctor.phone} on={up("doctor", "phone")} /></div></Sec>
        <Sec i={1} done={done}><div className="g"><F l="Full name" id="name" v={p.name} on={up("patient", "name")} /><F l="Age / DOB" id="age" v={p.age} on={up("patient", "age")} ph="66 Years" /><F l="Gender" o={["", "Male", "Female", "Other"]} v={p.gender} on={up("patient", "gender")} />
          <F l="Phone" id="phone" v={p.phone} on={up("patient", "phone")} ph="+91 9876543210" /><F l="Email (optional)" v={p.email} on={up("patient", "email")} /><F l="City" id="city" v={p.city} on={up("patient", "city")} /><F l="State" id="state" o={["", ...STATES]} v={p.state} on={up("patient", "state")} /><F l="PIN" v={p.pin} on={up("patient", "pin")} /><F l="Emergency contact" v={p.emergency} on={up("patient", "emergency")} /></div></Sec>
        <Sec i={2} done={done}><label style={{ display: "block", marginBottom: 8 }}><input type="checkbox" style={{ width: "auto" }} checked={!!v.ignore} onChange={e => up("vitals", "ignore")(e.target.checked)} /> Ignore vitals (record: "Vitals are confirmed as stated by patient.")</label>
          {v.ignore ? <div className="msg" style={{ background: "#e6f4f1" }}>Vitals are confirmed as stated by patient.</div> : <div className="g"><F l="Data source" o={["Patient-reported", "Clinician-measured", "Not provided", "Unknown", "Confirmed negative"]} v={v.source} on={up("vitals", "source")} /><F l="BP (mmHg)" v={v.bp} on={up("vitals", "bp")} ph="120/80" /><F l="Pulse (bpm)" v={v.pulse} on={up("vitals", "pulse")} /><F l="SpO2 (%)" v={v.spo2} on={up("vitals", "spo2")} />
            <F l="Temp" v={v.temp} on={up("vitals", "temp")} /><F l="Unit" o={["°C", "°F"]} v={v.tempUnit} on={up("vitals", "tempUnit")} /><F l="Weight (kg)" v={v.weight} on={up("vitals", "weight")} /><F l="Height (cm)" v={v.height} on={up("vitals", "height")} /></div>}
          <div className="g" style={{ marginTop: 8 }}><F l="Known drug allergies" id="allergies" v={v.allergies} on={up("vitals", "allergies")} ph="e.g. NKDA" /><F l="Special status (Preg/Lact/Renal)" v={v.special} on={up("vitals", "special")} /></div></Sec>
        <Sec i={3} done={done}><F l="Chief complaints (one per line)" ta id="complaints" v={d.clin.complaints} on={up("clin", "complaints")} /><F l="Onset & duration" v={d.clin.onset} on={up("clin", "onset")} />
          <F l="Past history & current medications" ta v={d.clin.hx} on={up("clin", "hx")} /><F l="Provisional diagnosis / clinical impression" ta id="dx" v={d.clin.dx} on={up("clin", "dx")} /><F l="Clinical direction (assessment notes)" ta v={d.clin.notes} on={up("clin", "notes")} /></Sec>
        <Sec i={4} done={done}><Rows rows={d.inv} set={x => setD(p => ({ ...p, inv: x }))} addLabel="Add Investigation" id="inv" fields={[{ k: "name", l: "Investigation", r: 1 }, { k: "cat", l: "Category", o: ["Laboratory", "Imaging", "Cardiac", "Other"] }, { k: "status", l: "Status", o: ["Advised", "Ordered", "Completed", "Result Pending"] }, { k: "instr", l: "Instructions" }]} /></Sec>
        <Sec i={5} done={done}><Rows rows={d.meds} set={x => setD(p => ({ ...p, meds: x }))} addLabel="Add Drug" id="meds" fields={[{ k: "name", l: "Medicine", r: 1 }, { k: "strength", l: "Strength" }, { k: "route", l: "Route", o: ["Oral", "Topical", "Inhalation", "Injection", "Other"] }, { k: "freq", l: "Frequency" }, { k: "dur", l: "Duration" }, { k: "instr", l: "Instructions" }]} />
          {!d.meds.length && <small>No medicines will be shown on the record as prescribed.</small>}</Sec>
        <Sec i={6} done={done}><div className="g"><F l="Clinical advice (one per line)" ta id="advice" v={a.advice} on={up("adv", "advice")} /><F l="Dietary advice" ta v={a.diet} on={up("adv", "diet")} /><F l="Lifestyle recommendations" ta v={a.lifestyle} on={up("adv", "lifestyle")} /><F l="Medication counselling" ta v={a.counsel} on={up("adv", "counsel")} /></div>
          <h2 style={{ marginTop: 10 }}>Follow-up</h2><div className="g"><F l="Follow-up date" t="date" v={a.follow} on={up("adv", "follow")} /><F l="Follow-up mode" o={["Video Call", "Audio Call", "In-Person"]} v={a.followMode} on={up("adv", "followMode")} /><F l="Reports / investigations to bring" v={a.bring} on={up("adv", "bring")} /><F l="Patient instructions" ta v={a.instr} on={up("adv", "instr")} /></div>
          <label style={{ marginTop: 8, color: "#b91c1c" }}>Emergency red-flag warning (editable)<textarea style={{ background: "#fdecec" }} value={a.flags} onChange={e => up("adv", "flags")(e.target.value)} /></label><F l="Additional notes" ta v={a.notes} on={up("adv", "notes")} /></Sec>
        <Sec i={7} done={done}><p><b>{d.id}</b> • {p.name || "—"} • Status: <b>{status}</b></p><small>Fill the required fields (*), then generate. The record is saved to your account and the PDF is generated by the server.</small>
          <div style={{ marginTop: 8 }}><button className="p" onClick={genPdf}>Generate A4 PDF</button>{pdfReady && <span> Downloaded ✓</span>}<button onClick={newConsult}>Start new consultation</button></div></Sec>
      </main>
      <div className={"pv " + (tab === "form" ? "hide" : "")}>
        <div className="pvbar" style={{ display: "flex", gap: 6, marginBottom: 8 }}><button className={pv === "A4" ? "p" : ""} onClick={() => setPv("A4")}>A4 Preview</button><button className={pv === "D" ? "p" : ""} onClick={() => setPv("D")}>Data Summary</button><button className="p" onClick={genPdf}>⬇ Download PDF</button><span className="sp" style={{ flex: 1 }} />
          <button onClick={() => setZoom(z => Math.max(.4, z - .1))}>−</button><b style={{ padding: 6 }}>{Math.round(zoom * 100)}%</b><button onClick={() => setZoom(z => Math.min(1.2, z + .1))}>+</button></div>
        {pv === "D" ? <pre style={{ background: "#fff", padding: 10, whiteSpace: "pre-wrap" }}>{JSON.stringify(d, null, 2)}</pre> :
          <div style={{ width: 794 * zoom, height: 1123 * zoom }}><div className="page" style={{ transform: `scale(${zoom})` }}>
            {status !== "Complete" && <div className="wm">DRAFT</div>}<b style={{ color: "#0f766e" }}>TELECONSULTATION RECORD</b>
            <div style={{ float: "right", textAlign: "right", fontSize: 11 }}>Date: {d.meta.date} {d.meta.time}<br />Ref: {d.id}<br />{d.meta.type} ({d.meta.mode}){d.meta.followRef && <><br />Follow-up of {d.meta.followRef}</>}</div>
            <h1 style={{ margin: "6px 0" }}>{d.doctor.name || "Doctor name"} <span style={{ color: "#0f766e" }}>{d.doctor.qual}</span></h1>
            {d.doctor.spec && <div style={{ fontSize: 11 }}>{d.doctor.spec}</div>}<div style={{ fontSize: 11 }}>Reg. No: {d.doctor.reg || "—"} {d.doctor.council && `(${d.doctor.council})`} {d.doctor.phone && ` • ${d.doctor.phone}`}</div>
            <h3>PATIENT DETAILS</h3><p>{p.name || "—"} • {p.age} / {p.gender} • {p.phone}{p.email && ` • ${p.email}`}{"\n"}{[p.city, p.state, p.pin].filter(Boolean).join(", ")}{p.emergency && `\nEmergency contact: ${p.emergency}`}</p>
            {(v.allergies || v.special) && <><h3>ALLERGIES & SAFETY</h3><p>{v.allergies && `Drug allergies: ${v.allergies}\n`}{v.special && `Special status: ${v.special}`}</p></>}
            {v.ignore ? <><h3>VITALS</h3><p>Vitals are confirmed as stated by patient.</p></> : (v.bp || v.pulse || v.spo2 || v.temp || v.weight) && <><h3>VITALS ({v.source})</h3><p>{[v.bp && `BP ${v.bp} mmHg`, v.pulse && `Pulse ${v.pulse} bpm`, v.spo2 && `SpO2 ${v.spo2}%`, v.temp && `Temp ${v.temp}${v.tempUnit}`, v.weight && `Wt ${v.weight} kg`, v.height && `Ht ${v.height} cm`].filter(Boolean).join("  •  ")}</p></>}
            {d.clin.complaints && <><h3>CLINICAL PRESENTATION</h3><p><b>Complaints:</b>{"\n"}{lines(d.clin.complaints).map(l => "• " + l).join("\n")}{d.clin.onset && `\nOnset/duration: ${d.clin.onset}`}</p>{d.clin.hx && <p><b>History / current medications:</b>{"\n"}{d.clin.hx}</p>}{d.clin.dx && <p><b>Provisional impression:</b>{"\n"}{d.clin.dx}</p>}{d.clin.notes && <p><b>Clinical direction:</b> {d.clin.notes}</p>}</>}
            {d.inv.length > 0 && <><h3>DIAGNOSTIC INVESTIGATIONS</h3>{d.inv.map((x, i) => <p key={i}>{i + 1}. {x.name} <i>[{x.status}]</i> {x.instr}</p>)}</>}
            <h3>PRESCRIPTION / MEDICATIONS</h3>{d.meds.length ? <table><thead><tr>{["#", "Drug", "Strength", "Route", "Frequency", "Duration", "Instructions"].map(h => <th key={h}>{h}</th>)}</tr></thead><tbody>{d.meds.map((m, i) => <tr key={i}><td>{i + 1}</td><td>{m.name}</td><td>{m.strength}</td><td>{m.route}</td><td>{m.freq}</td><td>{m.dur}</td><td>{m.instr}</td></tr>)}</tbody></table> : <p>No medicines prescribed.</p>}
            {(a.advice || a.diet || a.lifestyle || a.counsel || a.follow || a.bring || a.instr || a.notes) && <><h3>ADVICE & FOLLOW-UP</h3>{a.advice && <p>{lines(a.advice).map(l => "• " + l).join("\n")}</p>}{a.diet && <p><b>Diet:</b> {a.diet}</p>}{a.lifestyle && <p><b>Lifestyle:</b> {a.lifestyle}</p>}{a.counsel && <p><b>Medication counselling:</b> {a.counsel}</p>}{a.follow && <p><b>Follow-up:</b> {a.follow} ({a.followMode})</p>}{a.bring && <p><b>Bring to follow-up:</b> {a.bring}</p>}{a.instr && <p><b>Patient instructions:</b> {a.instr}</p>}{a.notes && <p>{a.notes}</p>}</>}
            {a.flags && <div className="red" style={{ marginTop: 10 }}><b>⚠ Emergency Red-Flag Warning</b>{"\n"}{a.flags}</div>}
            <div style={{ marginTop: 50, textAlign: "right", fontSize: 11 }}>______________________<br />Doctor signature (not digitally signed)<br />{d.doctor.name}</div>
            <div style={{ position: "absolute", bottom: 14, left: 36, right: 36, fontSize: 9, color: "#667" }}>Teleconsultation record • Not a substitute for in-person evaluation <span style={{ float: "right" }}>Page 1 / 1</span></div>
          </div></div>}
      </div></div></div>;
}
