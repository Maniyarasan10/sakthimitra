const BASE_URL = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

async function apiFetch(path, options = {}) {
  const url = path.startsWith("http") ? path : `${BASE_URL}${path}`;
  const token = localStorage.getItem("auth_token") || null;
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const init = {
    headers,
    ...options,
  };
  const res = await fetch(url, init);
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return res.json();
  return res.text();
}

export { BASE_URL, apiFetch };
