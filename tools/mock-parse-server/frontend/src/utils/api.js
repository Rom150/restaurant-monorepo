export async function parseFileWithServer(file) {
  try {
    const form = new FormData();
    form.append('file', file);
    // en dev la proxy peut pointer vers http://localhost:9000, sinon fetch('/parse')
    const resp = await fetch('/parse', { method: 'POST', body: form });
    const text = await resp.text();
    let json;
    try { json = text ? JSON.parse(text) : {}; } catch (e) {
      return { ok: false, parsed: false, items: [], meta: null, errorMessage: 'Invalid JSON from server', raw: text };
    }
    if (json.error) {
      return { ok: false, parsed: false, items: [], meta: json.meta || null, errorMessage: json.detail || json.error, raw: json };
    }
    const items = Array.isArray(json.items) ? json.items : [];
    const parsed = !!(json.meta && json.meta.parsed === false ? false : items.length > 0);
    return { ok: resp.ok, parsed, items, meta: json.meta || null, errorMessage: null, raw: json };
  } catch (err) {
    return { ok: false, parsed: false, items: [], meta: null, errorMessage: String(err) };
  }
}
