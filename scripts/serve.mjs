// Zero-dependency static server for the prototype: `npm start`, then open the printed URL.
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../app');
const port = Number(process.env.PORT ?? 5173);
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
};

http
  .createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const file = path.join(root, path.normalize(decodeURIComponent(url.pathname)).replace(/^([/\\])+/, ''));
    if (!file.startsWith(root)) {
      res.writeHead(403).end();
      return;
    }
    try {
      const stat = await fs.stat(file);
      const target = stat.isDirectory() ? path.join(file, 'index.html') : file;
      const body = await fs.readFile(target);
      res.writeHead(200, { 'content-type': types[path.extname(target)] ?? 'application/octet-stream' });
      res.end(body);
    } catch {
      res.writeHead(404, { 'content-type': 'text/plain' }).end('Not found');
    }
  })
  .listen(port, () => console.log(`Lynia prototype on http://localhost:${port}`));
