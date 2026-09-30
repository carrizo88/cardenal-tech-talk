import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
const root = fs.realpathSync(new URL('..', import.meta.url));
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'release-manifest.json'), 'utf8'));
for (const item of manifest.files) {
  if (path.isAbsolute(item.path) || item.path.includes('\\') || item.path.split('/').some(p => !p || p === '.' || p === '..')) throw new Error('Ruta inválida en manifiesto.');
  let current = root;
  for (const part of item.path.split('/')) { current = path.join(current, part); if (fs.lstatSync(current).isSymbolicLink()) throw new Error('Enlace inesperado.'); }
  const digest = createHash('sha256').update(fs.readFileSync(current)).digest('hex');
  if (digest !== item.sha256) throw new Error(`Contenido modificado: ${item.path}`);
}
console.log(`Cardenal ${manifest.version}: ${manifest.files.length} archivos verificados.`);
