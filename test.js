const fs = require('fs');
fetch('http://localhost:3000/api/analyze-audio', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ audioBase64: 'data:audio/webm;base64,UklGRiQAAABXRUJFRk1UWAoAAAAQAAAAAQAAgAAAAAAA', mimeType: 'audio/webm' })
}).then(r => r.json()).then(console.log).catch(console.error);
