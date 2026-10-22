const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";
export async function api(path, method = "GET", body, blob) {
  const headers = { "Content-Type": "application/json" }, k = sessionStorage.getItem("tc_admin_key"); if (k) headers["X-Admin-Key"] = k;
  let r;
  try { r = await fetch(BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined }); }
  catch { throw new Error("Cannot reach the server. Is the backend running on " + BASE + "?"); }
  if (!r.ok) { let m = r.statusText; try { const j = await r.json(); m = typeof j.detail === "string" ? j.detail : JSON.stringify(j.detail); } catch {} throw new Error(m); }
  return blob ? r.blob() : r.status === 204 ? null : r.json();
}
