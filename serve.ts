import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('./game', import.meta.url));
const types = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
]);

createServer((request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD' }).end();
    return;
  }
  let path;
  try {
    path = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname);
    if (path.includes('\0') || path.includes('\\')) throw new Error('Invalid path');
  } catch {
    response.writeHead(400).end('Invalid path');
    return;
  }
  const file = resolve(root, path === '/' ? 'index.html' : '.' + path);
  if (!file.startsWith(root + sep)) {
    response.writeHead(403).end('Forbidden');
    return;
  }
  const info = statSync(file, { throwIfNoEntry: false });
  if (!info?.isFile()) {
    response.writeHead(404).end('File not found');
    return;
  }
  response.writeHead(200, {
    'Content-Type': types.get(extname(file)) ?? 'application/octet-stream',
    'Content-Length': info.size,
  });
  if (request.method === 'HEAD') response.end();
  else createReadStream(file).on('error', () => response.destroy()).pipe(response);
}).listen(8080, 'localhost', () => console.log('Aurora Ridge Courier on http://localhost:8080'));
