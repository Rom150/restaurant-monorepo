/**
 * parseFileWithServer - Robust wrapper for server-side PDF parsing
 * 
 * Posts the file to /parse endpoint and safely parses response
 * Returns normalized object: { ok, parsed, items, meta, errorMessage, raw }
 * 
 * @param {File} file - The file to parse
 * @returns {Promise<Object>} Normalized parse result
 */
export async function parseFileWithServer(file) {
  if (!file) {
    return {
      ok: false,
      parsed: false,
      items: [],
      meta: {},
      errorMessage: 'No file provided',
      raw: null
    };
  }

  try {
    const fd = new FormData();
    fd.append('file', file, file.name);
    
    const res = await fetch('http://localhost:9000/parse', { 
      method: 'POST', 
      body: fd 
    });

    // Get raw response text for inspection in case of JSON parse failure
    const rawText = await res.text();
    
    // Try to parse JSON
    let jsonData;
    try {
      jsonData = JSON.parse(rawText);
    } catch (jsonError) {
      console.error('Server returned invalid JSON:', rawText.substring(0, 500));
      return {
        ok: false,
        parsed: false,
        items: [],
        meta: {},
        errorMessage: 'Server returned invalid JSON (possibly HTML error page)',
        raw: rawText
      };
    }

    // Check if response indicates an error
    if (!res.ok || jsonData.error) {
      return {
        ok: false,
        parsed: false,
        items: [],
        meta: jsonData.meta || {},
        errorMessage: jsonData.error || jsonData.detail || res.statusText,
        raw: rawText
      };
    }

    // Successful response
    return {
      ok: true,
      parsed: jsonData.meta?.parsed !== false, // parsed is true unless explicitly set to false
      items: jsonData.items || [],
      meta: jsonData.meta || {},
      errorMessage: null,
      raw: rawText
    };
  } catch (error) {
    console.error('parseFileWithServer error:', error);
    return {
      ok: false,
      parsed: false,
      items: [],
      meta: {},
      errorMessage: error.message || String(error),
      raw: null
    };
  }
}

// Legacy function for backward compatibility
export async function uploadParse(file) {
  const result = await parseFileWithServer(file);
  if (!result.ok) {
    throw new Error(result.errorMessage || 'parse failed');
  }
  return { items: result.items, meta: result.meta };
}
