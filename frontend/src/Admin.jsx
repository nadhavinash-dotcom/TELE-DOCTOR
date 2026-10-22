import { useState, useEffect } from "react";
import { api } from "./api.js";
const CSS = `*{box-sizing:border-box}body{margin:0;font:14px system-ui,sans-serif;color:#0f1f3d;background:#eef3f6}
.adm{display:grid;grid-template-columns:210px 1fr;grid-template-rows:56px 1fr;min-height:100vh}
.adm header{grid-column:1/3;background:#fff;border-bottom:1px solid #dbe4ea;display:flex;align-items:center;gap:10px;padding:0 18px}.adm header b{font-size:17px}.sp{flex:1}
.adm aside{background:#fff;border-right:1px solid #dbe4ea;padding:12px}.adm aside button{display:block;width:100%;text-align:left;padding:10px 12px;margin-bottom:6px;border:0;background:none;border-radius:8px;font:inherit;font-weight:600;cursor:pointer;color:#334155}.adm aside button.on{background:#e6f4f1;color:#0f766e}
.content{padding:18px;overflow:auto}.panel{background:#fff;border:1px solid #dbe4ea;border-radius:12px;padding:16px}h2{margin:0 0 4px;font-size:20px}.sub{color:#64748b;margin-bottom:12px}
.tools{display:flex;gap:8px;margin:12px 0;flex-wrap:wrap}.tools input,.tools select,.keybox input{padding:8px 10px;border:1px solid #cdd8df;border-radius:8px;font:inherit}.tools input{flex:1;min-width:180px}
button.p,a.p{background:#0f766e;color:#fff;border:0;border-radius:8px;padding:8px 14px;font:inherit;font-weight:600;cursor:pointer;text-decoration:none;display:inline-block}button.p:disabled{opacity:.5}
table{width:100%;border-collapse:collapse}th{text-align:left;background:#f4f7fa;padding:10px;font-size:13px;color:#334155}td{padding:10px;border-top:1px solid #eef2f5;font-size:13px}
.pill{padding:2px 10px;border-radius:99px;font-size:12px;font-weight:600}.pill.Complete,.pill.INFO{background:#dcfce7;color:#166534}.pill.Draft,.pill.WARN{background:#fef3c7;color:#92400e}.pill.ERROR{background:#fee2e2;color:#991b1b}
.pager{display:flex;gap:10px;align-items:center;justify-content:flex-end;margin-top:12px}.pager button{border:1px solid #cdd8df;background:#fff;border-radius:8px;padding:6px 12px;cursor:pointer}
.err{background:#fee2e2;color:#991b1b;padding:10px;border-radius:8px;margin:8px 0}.keybox{background:#fff3cd;padding:10px;border-radius:8px;margin-bottom:12px;display:flex;gap:8px}
.ov{position:fixed;inset:0;background:#0f1f3d88;display:flex;align-items:center;justify-content:center;z-index:20;padding:2vh 2vw}.big{width:min(1300px,100%);height:100%;background:#f4f7fa;border-radius:14px;overflow:auto;display:flex;flex-direction:column}.bighead{position:sticky;top:0;z-index:2;background:#fff;border-bottom:1px solid #dbe4ea;padding:14px 22px;display:flex;align-items:center;gap:14px;flex-wrap:wrap}.bigbody{padding:18px 22px;display:grid;grid-template-columns:1fr 1fr;gap:14px;align-items:start}.bigbody .grp{margin:0;background:#fff}.bigbody .full{grid-column:1/3}.full .grid2{grid-template-columns:repeat(4,1fr)}.btns{display:flex;gap:10px}button.alt{background:#1d4ed8}@media(max-width:900px){.bigbody{grid-template-columns:1fr}.bigbody .full{grid-column:1}.full .grid2{grid-template-columns:1fr 1fr}}
.grp{border:1px solid #dbe4ea;border-radius:10px;margin:12px 0;overflow:hidden}.grp h4{margin:0;padding:9px 12px;background:#f1f7f6;font-size:14px;color:#0f5f58}.grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:12px}
.info small{color:#64748b;display:block;font-size:12px}.info.wide{grid-column:1/-1}.info div{white-space:pre-wrap}.mod{position:fixed;inset:0;background:#0f1f3daa;z-index:30;display:flex;flex-direction:column;padding:18px}.mod .bar{display:flex;gap:10px;margin-bottom:10px}.mod iframe{flex:1;border:0;background:#fff;border-radius:8px}
@media(max-width:800px){.adm{grid-template-columns:1fr}.adm header{grid-column:1}.adm aside{display:flex;gap:6px}.content{padding:10px}}`;
const T = iso => iso ? new Date(iso).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "medium" }) : "—";
const Info = ({ l, v, w }) => <div className={"info" + (w ? " wide" : "")}><small>{l}</small><div>{v || "—"}</div></div>;
const Pager = ({ page, pages, set }) => <div className="pager"><button disabled={page <= 1} onClick={() => set(page - 1)}>‹ Prev</button><span>Page {page} of {pages || 1}</span><button disabled={page >= pages} onClick={() => set(page + 1)}>Next ›</button></div>;
function Detail({ id, onClose }) {
  const [r, setR] = useState(null), [rep, setRep] = useState(null), [err, setErr] = useState("");
  useEffect(() => { api("/api/admin/patients/" + id).then(setR).catch(e => setErr(e.message)); }, [id]);
  const open = async () => { try { setRep(URL.createObjectURL(await api(`/api/admin/patients/${id}/pdf`, "GET", null, true))); } catch (e) { setErr(e.message); } };
  const shut = () => { rep && URL.revokeObjectURL(rep); setRep(null); };
  const d = r?.data || {}, p = d.patient || {}, v = d.vitals || {}, c = d.clin || {}, a = d.adv || {}, m = d.meta || {}, dr = d.doctor || {};
  const vit = v.ignore ? "Vitals are confirmed as stated by patient." : [v.bp && "BP " + v.bp + " mmHg", v.pulse && "Pulse " + v.pulse + " bpm", v.spo2 && "SpO2 " + v.spo2 + "%", v.temp && "Temp " + v.temp + " " + (v.tempUnit || ""), v.weight && "Weight " + v.weight + " kg", v.height && "Height " + v.height + " cm"].filter(Boolean).join("  •  ");
  const dl = async () => { try { const b = await api(`/api/admin/patients/${id}/pdf`, "GET", null, true), u = URL.createObjectURL(b), x = document.createElement("a"); x.href = u; x.download = `consultation-${id}.pdf`; document.body.appendChild(x); x.click(); x.remove(); setTimeout(() => URL.revokeObjectURL(u), 10000); } catch (e) { setErr(e.message); } };
  useEffect(() => { const k = e => { if (e.key === "Escape") { rep ? shut() : onClose(); } }; window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [rep]);
  const Btns = () => <div className="btns"><button className="p" onClick={open}>👁 View Report</button><button className="p alt" onClick={dl}>⬇ Download Report</button></div>;
  return <div className="ov" onClick={onClose}><div className="big" onClick={e => e.stopPropagation()}>
    <div className="bighead"><div style={{ flex: 1 }}><h2 style={{ margin: 0 }}>Patient Details</h2>{r && <div><b style={{ fontSize: 17 }}>{r.patientId}</b> &nbsp;<b>{p.name || "—"}</b> &nbsp;<span className={"pill " + r.status}>{r.status}</span> <small>&nbsp;Registered {T(r.created)}</small></div>}</div>
      {r && <Btns />}<button onClick={onClose} style={{ border: 0, background: "none", fontSize: 24, cursor: "pointer" }}>✕</button></div>
    {err && <div className="err" style={{ margin: 18 }}>{err}</div>}{!r && !err && <p style={{ padding: 22 }}>Loading…</p>}
    {r && <><div className="bigbody">
      <div className="grp"><h4>Personal Information</h4><div className="grid2"><Info l="Full name" v={p.name} /><Info l="Patient ID" v={r.patientId} /><Info l="Age" v={p.age} /><Info l="Gender" v={p.gender} /><Info l="Phone" v={p.phone} /><Info l="Email" v={p.email} /><Info l="Location" v={[p.city, p.state, p.pin].filter(Boolean).join(", ")} w /><Info l="Emergency contact" v={p.emergency} w /></div></div>
      <div className="grp"><h4>Medical Information</h4><div className="grid2"><Info l="Registered for / complaints" v={c.complaints} w /><Info l="Onset & duration" v={c.onset} /><Info l="Allergies" v={v.allergies} /><Info l="Medical history" v={c.hx} w /><Info l="Provisional diagnosis" v={c.dx} w /><Info l="Clinical direction" v={c.notes} w /><Info l="Vitals" v={vit} w /><Info l="Special status" v={v.special} w /></div></div>
      <div className="grp"><h4>Consultation Details</h4><div className="grid2"><Info l="Reference ID" v={r.id} /><Info l="Date / time" v={`${m.date || ""} ${m.time || ""}`} /><Info l="Mode" v={m.mode} /><Info l="Type" v={m.type} /><Info l="Doctor" v={`${dr.name || ""} ${dr.qual || ""}`} /><Info l="Reg. no." v={dr.reg} /><Info l="Status" v={r.status} /><Info l="Last updated" v={T(r.updated)} /></div></div>
      <div className="grp"><h4>Advice & Follow-up</h4><div className="grid2"><Info l="Clinical advice" v={a.advice} w /><Info l="Diet" v={a.diet} /><Info l="Lifestyle" v={a.lifestyle} /><Info l="Medication counselling" v={a.counsel} w /><Info l="Follow-up" v={a.follow ? `${a.follow} (${a.followMode})` : ""} /><Info l="Bring to follow-up" v={a.bring} /><Info l="Patient instructions" v={a.instr} w /><Info l="Notes" v={a.notes} w /><Info l="Emergency red-flag warning" v={a.flags} w /></div></div>
      <div className="grp full"><h4>Investigations</h4><div style={{ padding: 12 }}>{(d.inv || []).length ? d.inv.map((x, i) => <div key={i}>{i + 1}. {x.name} <small>({x.status}{x.instr ? ", " + x.instr : ""})</small></div>) : "—"}</div></div>
      <div className="grp full"><h4>Medications</h4><div style={{ padding: 12, overflowX: "auto" }}>{(d.meds || []).length ? <table><thead><tr><th>#</th><th>Drug</th><th>Strength</th><th>Route</th><th>Frequency</th><th>Duration</th><th>Instructions</th></tr></thead><tbody>{d.meds.map((x, i) => <tr key={i}><td>{i + 1}</td><td>{x.name}</td><td>{x.strength}</td><td>{x.route}</td><td>{x.freq}</td><td>{x.dur}</td><td>{x.instr}</td></tr>)}</tbody></table> : "No medicines prescribed"}</div></div>
    </div><div style={{ padding: "0 22px 22px" }}><Btns /></div></>}
    {rep && <div className="mod" onClick={e => e.stopPropagation()}><div className="bar"><a className="p" href={rep} download={`consultation-${id}.pdf`}>⬇ Download Report</a><span className="sp" /><button className="p" onClick={shut}>Close</button></div><iframe title="report" src={rep} /></div>}
  </div></div>;
}
function Patients({ tick, guard }) {
  const [q, setQ] = useState(""), [st, setSt] = useState(""), [page, setPage] = useState(1), [data, setData] = useState({ items: [], total: 0, pages: 1 }), [err, setErr] = useState(""), [sel, setSel] = useState(null), [n, setN] = useState(0);
  useEffect(() => { const t = setTimeout(() => api(`/api/admin/patients?q=${encodeURIComponent(q)}&status=${st}&page=${page}&size=10`).then(j => { setData(j); setErr(""); }).catch(e => setErr(guard(e))), 250); return () => clearTimeout(t); }, [q, st, page, tick, n]);
  return <div className="panel"><div style={{ display: "flex" }}><div style={{ flex: 1 }}><h2>Patient Database</h2><div className="sub">List of all registered patients ({data.total})</div></div><div><button className="p" onClick={() => setN(n + 1)}>⟳ Refresh</button></div></div>
    <div className="tools"><input placeholder="Search by name, patient ID or complaint…" value={q} onChange={e => { setQ(e.target.value); setPage(1); }} /><select value={st} onChange={e => { setSt(e.target.value); setPage(1); }}><option value="">All Status</option><option>Draft</option><option>Complete</option></select></div>
    {err && <div className="err">{err}</div>}
    <div style={{ overflowX: "auto" }}><table><thead><tr><th>Patient ID</th><th>Name</th><th>Date</th><th>Registered For</th><th>Status</th><th>Action</th></tr></thead><tbody>
      {data.items.map(r => <tr key={r.id}><td>{r.patientId}</td><td>{r.name || "—"}</td><td>{r.date}</td><td>{r.registeredFor || "—"}</td><td><span className={"pill " + r.status}>{r.status}</span></td><td><button className="p" onClick={() => setSel(r.id)}>View More</button></td></tr>)}
      {!data.items.length && !err && <tr><td colSpan={6}>No patients found</td></tr>}</tbody></table></div>
    <Pager page={data.page || page} pages={data.pages} set={setPage} />{sel && <Detail id={sel} onClose={() => setSel(null)} />}</div>;
}
function Logs({ tick, guard }) {
  const [lv, setLv] = useState(""), [q, setQ] = useState(""), [page, setPage] = useState(1), [data, setData] = useState({ items: [], total: 0, pages: 1 }), [err, setErr] = useState(""), [n, setN] = useState(0);
  useEffect(() => { const t = setTimeout(() => api(`/api/admin/logs?level=${lv}&q=${encodeURIComponent(q)}&page=${page}&size=15`).then(j => { setData(j); setErr(""); }).catch(e => setErr(guard(e))), 250); return () => clearTimeout(t); }, [lv, q, page, tick, n]);
  return <div className="panel"><div style={{ display: "flex" }}><div style={{ flex: 1 }}><h2>Backend Logs</h2><div className="sub">API activity and system events ({data.total}, kept 30 days)</div></div><div><button className="p" onClick={() => setN(n + 1)}>⟳ Refresh</button></div></div>
    <div className="tools"><input placeholder="Search log messages…" value={q} onChange={e => { setQ(e.target.value); setPage(1); }} /><select value={lv} onChange={e => { setLv(e.target.value); setPage(1); }}><option value="">All Levels</option><option>INFO</option><option>WARN</option><option>ERROR</option></select></div>
    {err && <div className="err">{err}</div>}
    <div style={{ overflowX: "auto" }}><table><thead><tr><th>Time (IST)</th><th>Level</th><th>Message</th><th>Status</th><th>ms</th><th>IP</th></tr></thead><tbody>
      {data.items.map((r, i) => <tr key={i}><td style={{ whiteSpace: "nowrap" }}>{T(r.ts)}</td><td><span className={"pill " + r.level}>{r.level}</span></td><td>{r.message}</td><td>{r.status}</td><td>{r.ms}</td><td>{r.ip}</td></tr>)}
      {!data.items.length && !err && <tr><td colSpan={6}>No logs yet</td></tr>}</tbody></table></div><Pager page={data.page || page} pages={data.pages} set={setPage} /></div>;
}
export default function Admin() {
  const [tab, setTab] = useState("patients"), [need, setNeed] = useState(false), [tick, setTick] = useState(0), [k, setK] = useState("");
  const guard = e => { if (/admin key/i.test(e.message)) setNeed(true); return e.message; };
  return <div className="adm"><style>{CSS}</style>
    <header><span style={{ fontSize: 22 }}>🩺</span><b>Teleconsult</b><small>Admin Panel</small><span className="sp" /><a href="/">← Doctor app</a></header>
    <aside><button className={tab === "patients" ? "on" : ""} onClick={() => setTab("patients")}>👥 Patient Database</button><button className={tab === "logs" ? "on" : ""} onClick={() => setTab("logs")}>📄 Backend Logs</button></aside>
    <div className="content">{need && <form className="keybox" onSubmit={e => { e.preventDefault(); sessionStorage.setItem("tc_admin_key", k); setNeed(false); setTick(tick + 1); }}><input type="password" placeholder="Admin key" value={k} onChange={e => setK(e.target.value)} /><button className="p">Unlock</button></form>}
      {tab === "patients" ? <Patients tick={tick} guard={guard} /> : <Logs tick={tick} guard={guard} />}</div></div>;
}
