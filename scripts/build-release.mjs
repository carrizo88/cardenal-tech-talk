import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { buildCopy } from './build-copy.mjs';

const root = fs.realpathSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '..'));
const local = path.join(root, '.local');
fs.mkdirSync(local, { recursive: true });
if (fs.lstatSync(local).isSymbolicLink()) throw new Error('Staging no puede ser un enlace.');
const stage = fs.mkdtempSync(path.join(local, 'release-build-'));
const copy = (from, to) => {
  const source = path.join(root, from);
  const check = p => { if (['private', 'user-memory', 'node_modules', '.git'].includes(path.basename(p)) || /^\.env(?:$|\.)/.test(path.basename(p))) throw new Error('Fuente privada o generada no permitida.'); if (fs.lstatSync(p).isSymbolicLink()) throw new Error(`Enlace no permitido: ${p}`); if (fs.statSync(p).isDirectory()) for (const n of fs.readdirSync(p)) check(path.join(p,n)); };
  check(source);
  fs.cpSync(source, path.join(stage, to), { recursive: true });
};
for (const folder of ['src', 'templates', 'test', 'doc']) copy(folder, `A/${folder}`);
copy('package.json', 'A/package.json');
const pkg = JSON.parse(fs.readFileSync(path.join(stage, 'A/package.json'), 'utf8'));
delete pkg.scripts['release:build']; delete pkg.scripts['release:verify'];
fs.writeFileSync(path.join(stage, 'A/package.json'), JSON.stringify(pkg, null, 2) + '\n');
copy('scripts/build-copy.mjs', 'A/scripts/build-copy.mjs');
const generator = path.join(stage, 'A/scripts/build-copy.mjs');
fs.writeFileSync(generator, fs.readFileSync(generator, 'utf8').replace("'release/B'", "'../B'"));
for (const rel of ['README.md', 'verify-release.mjs', 'A/README.md', 'A/CHANGELOG.md', 'A/.gitignore', 'A/scripts/verify-release.mjs']) copy(`distribution/${rel}`, rel);
buildCopy(path.join(stage, 'B'));
const manifest = dir => {
  const files = [];
  const walk = (at, prefix = '') => {
    for (const name of fs.readdirSync(at).sort()) {
      const file = path.join(at,name), rel = prefix + name;
      if (fs.lstatSync(file).isSymbolicLink()) throw new Error('Enlace inesperado.');
      if (fs.statSync(file).isDirectory()) walk(file, rel + '/');
      else if (rel !== 'release-manifest.json') files.push({path:rel, sha256:createHash('sha256').update(fs.readFileSync(file)).digest('hex')});
    }
  };
  walk(dir);
  fs.writeFileSync(path.join(dir, 'release-manifest.json'), JSON.stringify({version:pkg.version, files}, null, 2) + '\n');
};
manifest(path.join(stage,'A')); manifest(stage);
const target = path.resolve(root, 'release');
// Only replace this repository's generated release, never a linked or Git checkout.
if (target !== path.join(root, 'release') || path.dirname(target) !== root) throw new Error('Destino inválido.');
if (fs.existsSync(target)) {
  const verifySafe = dir => {
    if (fs.lstatSync(dir).isSymbolicLink()) throw new Error('Release contiene un enlace.');
    if (path.basename(dir) === '.git') throw new Error('Release tiene Git propio; no se reemplaza.');
    if (fs.statSync(dir).isDirectory()) for (const name of fs.readdirSync(dir)) verifySafe(path.join(dir,name));
  };
  verifySafe(target);
  fs.rmSync(target, { recursive:true });
}
fs.renameSync(stage,target);
console.log(`Cardenal ${pkg.version}: release/A y release/B generados.`);
