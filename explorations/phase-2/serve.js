// DISPOSABLE. A minimal static file server for viewing the Foundation Board locally.
// Usage, from the repository root:  node explorations/phase-2/serve.js
// Then open http://localhost:4173/explorations/phase-2/foundation-board.html
// No dependencies. Serves files from the repository root, read-only, on localhost only.
const http = require('http'), fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..', '..');
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml' };
const port = process.env.PORT || 4173;
http.createServer((req, res) => {
  let rel = decodeURIComponent(req.url.split('?')[0]);
  if (rel === '/') rel = '/explorations/phase-2/foundation-board.html';
  const file = path.join(root, rel);
  if (!file.startsWith(root)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(data);
  });
}).listen(port, '127.0.0.1', () => console.log('Foundation Board: http://localhost:' + port + '/'));
