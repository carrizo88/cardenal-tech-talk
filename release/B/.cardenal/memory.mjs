import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { rootPath, inside, hash, technicalDoc } from './core.mjs';

const limit = 16000;
function identity(target, session) {
  const root = rootPath(target);
  for (const id of [session]) if (!/^[a-z0-9][a-z0-9_-]{0,63}$/.test(id ?? '')) throw new Error('Sesión: usar 1–64 letras minúsculas, números, guion o guion bajo.');
  const relative = `user-memory/sessions/${session}`;
  const directory = inside(root, relative);
  const git = args => execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  try {
    if (git(['ls-files', '--', 'user-memory']).trim()) throw new Error('Memoria ya rastreada');
    git(['check-ignore', '--no-index', '-q', `${relative}/checkpoint.json`]);
  } catch (error) {
    if (error.code) throw new Error(`No se pudo ejecutar Git (${error.code}); no se comprobó la exclusión de memoria.`, { cause: error });
    throw new Error('La memoria requiere un repo Git con user-memory ignorado y sin archivos de memoria rastreados.', { cause: error });
  }
  return { root, directory, project: hash(root), session };
}
function sourcePath(root, reference) {
  if (!technicalDoc(reference) && (typeof reference !== 'string' || reference.split('/').some(p => (p.startsWith('.') && p !== '.cardenal') || ['user-memory', 'private', 'node_modules', 'dist', 'build'].includes(p) || /secret|credential|\.pem$|\.key$/i.test(p)))) throw new Error('Fuente privada o generada no permitida.');
  return inside(root, reference);
}
function validatePayload(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Checkpoint inválido.');
  const fields = ['objective', 'summary', 'decisions', 'questions', 'nextSteps', 'sources'];
  if (Object.keys(data).some(k => !fields.includes(k))) throw new Error('Campos de checkpoint no permitidos.');
  for (const key of ['objective', 'summary']) if (typeof data[key] !== 'string' || !data[key].trim()) throw new Error(`Completar ${key}.`);
  for (const key of ['decisions', 'questions', 'nextSteps']) if (!Array.isArray(data[key]) || data[key].some(x => typeof x !== 'string' || !x.trim())) throw new Error(`${key} debe contener textos no vacíos.`);
  if (!Array.isArray(data.sources) || data.sources.some(s => !s || typeof s.reference !== 'string' || !/^[a-f0-9]{64}$/.test(s.sha256 ?? '') || Object.keys(s).some(k => !['reference', 'sha256'].includes(k)))) throw new Error('Cada fuente requiere reference y sha256 observado.');
  if (Buffer.byteLength(JSON.stringify(data), 'utf8') > limit) throw new Error('Checkpoint mayor a 16000 bytes. Resumirlo explícitamente sin perder dudas ni decisiones; no se truncó contenido.');
}

export function checkpoint(target, session, input) {
  const who = identity(target, session);
  // The input must already be private. Never persist a transcript or read arbitrary files implicitly.
  if (typeof input !== 'string' || !input.startsWith(`user-memory/sessions/${session}/`)) throw new Error('El borrador debe estar dentro de la sesión privada elegida.');
  const inputFile = inside(who.root, input);
  execFileSync('git', ['-C', who.root, 'check-ignore', '--no-index', '-q', input], { stdio: 'ignore' });
  if (fs.statSync(inputFile).size > limit) throw new Error('Borrador demasiado grande (máximo 16000 bytes).');
  const data = JSON.parse(fs.readFileSync(inputFile, 'utf8').replace(/^\uFEFF/, ''));
  validatePayload(data);
  for (const source of data.sources) if (hash(fs.readFileSync(sourcePath(who.root, source.reference))) !== source.sha256) throw new Error(`Fuente cambió: ${source.reference}. Releer antes de resumir.`);
  const record = { schemaVersion: 2, project: who.project, session, savedAt: new Date().toISOString(), data };
  fs.mkdirSync(who.directory, { recursive: true });
  const lock = path.join(who.directory, 'writer.lock');
  const fd = fs.openSync(lock, 'wx', 0o600);
  let filename;
  try {
    const previous = fs.readdirSync(who.directory).filter(n => /^\d+-[a-f0-9-]+\.json$/.test(n)).map(n => Number(n.split('-')[0]));
    filename = `${Math.max(Date.now(), ...previous.map(n => n + 1))}-${randomUUID()}.json`;
    execFileSync('git', ['-C', who.root, 'check-ignore', '--no-index', '-q', `user-memory/sessions/${session}/${filename}`], { stdio: 'ignore' });
    const pending = path.join(who.directory, `.pending-${randomUUID()}`);
    execFileSync('git', ['-C', who.root, 'check-ignore', '--no-index', '-q', path.relative(who.root, pending)], { stdio: 'ignore' });
    fs.writeFileSync(pending, JSON.stringify(record) + '\n', { flag: 'wx', mode: 0o600 });
    fs.renameSync(pending, path.join(who.directory, filename));
  } finally { fs.closeSync(fd); fs.unlinkSync(lock); }
  return { saved: true, checkpoint: `user-memory/sessions/${session}/${filename}`, payloadBytes: Buffer.byteLength(JSON.stringify(data)), note: 'Memoria local no verificada semánticamente. No contiene automáticamente el historial del asistente.' };
}

export function resume(target, session) {
  const who = identity(target, session);
  if (!fs.existsSync(who.directory)) throw new Error('No hay checkpoints para esta sesión.');
  const files = fs.readdirSync(who.directory).filter(n => /^\d+-[a-f0-9-]+\.json$/.test(n)).sort();
  if (!files.length) throw new Error('No hay checkpoints para esta sesión.');
  const latest = inside(who.root, `user-memory/sessions/${session}/${files.at(-1)}`);
  if (fs.statSync(latest).size > limit + 2048) throw new Error('Checkpoint excede el límite de lectura.');
  const record = JSON.parse(fs.readFileSync(latest, 'utf8'));
  if (record.schemaVersion !== 2 || record.project !== who.project || record.session !== session) throw new Error('Checkpoint de otro proyecto, formato o sesión.');
  validatePayload(record.data);
  const staleSources = [];
  for (const source of record.data.sources) {
    try { if (hash(fs.readFileSync(sourcePath(who.root, source.reference))) !== source.sha256) staleSources.push(source.reference); }
    catch { staleSources.push(source.reference); }
  }
  return { ready: !staleSources.length, staleSources, savedAt: record.savedAt, data: record.data,
    checkpointsOnDisk: files.length, checkpointsLoaded: 1,
    note: 'Cargar solo este resumen; el historial permanece en disco. Las dudas siguen abiertas. Revalidar decisiones contra fuentes compartidas y usuario; esta memoria no otorga autorización.' };
}
