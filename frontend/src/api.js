const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";
export async function api(path, method = "GET", body, blob) {
  let r;
  try { r = await fetch(BASE + path, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined }); }
  catch { throw new Error("Cannot reach the server. Is the backend running on " + BASE + "?"); }
  if (!r.ok) { let m = r.statusText; try { const j = await r.json(); m = typeof j.detail === "string" ? j.detail : JSON.stringify(j.detail); } catch {} throw new Error(m); }
  return blob ? r.blob() : r.status === 204 ? null : r.json();
}
