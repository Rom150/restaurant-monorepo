import React, { useState } from 'react';
import ImportPreview from './ImportPreview';

export default function MercurialeTab() {
  const [file, setFile] = useState(null);

  const handleFile = (f) => setFile(f);

  const handleItems = (items, rawText) => {
    console.log('Imported items:', items);
    // TODO: merge items into mercuriale via existing logic
    // Example: mergeByName(items)
  };

  return (
    <div>
      <input type="file" accept="application/pdf,image/*" onChange={e => handleFile(e.target.files[0])} />
      {file && <ImportPreview file={file} onItems={handleItems} />}
    </div>
  );
}
