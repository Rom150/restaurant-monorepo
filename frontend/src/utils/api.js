export async function uploadParse(file) {
  if (!file) throw new Error('no file');
  const fd = new FormData();
  fd.append('file', file, file.name);
  const res = await fetch('http://localhost:9000/parse', { method: 'POST', body: fd });
  if (!res.ok) throw new Error('parse failed: ' + res.statusText);
  return res.json();
}
