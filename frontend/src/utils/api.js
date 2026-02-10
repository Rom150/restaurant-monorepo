// API helpers for file parsing
// - export uploadParse for existing callers (used in MercurialeTab, FichesTechniquesTab, etc.)
// - export parseFileWithServer as alias (backwards compatible with new code)
// - in development, target http://localhost:9000/parse; otherwise use relative '/parse'
const PARSE_URL = (process.env.NODE_ENV === 'development' ? 'http://localhost:9000/parse' : '/parse');

export async function uploadParse(file) {
  if (!file) throw new Error('no file');
  const fd = new FormData();
  fd.append('file', file, file.name || 'file');
  const res = await fetch(PARSE_URL, { method: 'POST', body: fd });
  const text = await res.text();

  // Try to parse JSON safely and normalize errors
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch (e) {
    throw new Error('Invalid JSON from parse server: ' + (text ? text.slice(0, 200) : '(empty)') + ' — ' + e.message);
  }

  if (!res.ok) {
    throw new Error(json.detail || json.error || `parse failed: ${res.status} ${res.statusText}`);
  }

  return json;
}

// Backward-compatible alias used by newer code
export const parseFileWithServer = uploadParse;

// Default export for compatibility
export default { uploadParse, parseFileWithServer };