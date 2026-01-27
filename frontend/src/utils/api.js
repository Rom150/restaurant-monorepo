export const getApiBase = () => process.env.REACT_APP_API_URL || '';

export async function uploadParse(file) {
  const base = getApiBase();
  if (!base) throw new Error('REACT_APP_API_URL not set');
  const fd = new FormData();
  fd.append('file', file);
  const token = localStorage.getItem('access_token') || localStorage.getItem('token') || null;
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
  const res = await fetch(`${base}/api/upload/parse`, {
    method: 'POST',
    body: fd,
    headers,
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Upload parse failed: ${res.status} ${txt}`);
  }
  return res.json();
}

export async function uploadCommit(payload) {
  const base = getApiBase();
  if (!base) throw new Error('REACT_APP_API_URL not set');
  const token = localStorage.getItem('access_token') || localStorage.getItem('token') || null;
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${base}/api/upload/commit`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Upload commit failed: ${res.status} ${txt}`);
  }
  return res.json();
}
