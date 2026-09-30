import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { checkpoint, resume } from '../src/memory.mjs';
import { hash, integrate } from '../src/core.mjs';

function setup(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cardenal-memory-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  execFileSync('git', ['init', root], { stdio: 'ignore' }); integrate(root);
  fs.writeFileSync(path.join(root, 'source.txt'), 'observed');
  const data = { objective: 'Prueba ficticia', summary: 'Resumen sin suponer decisiones', decisions: [], questions: ['¿Quién puede editar?'], nextSteps: ['Preguntar al usuario'], sources: [{ reference: 'source.txt', sha256: hash('observed') }] };
  const draft = 'user-memory/sessions/session-a/draft.json';
  fs.mkdirSync(path.dirname(path.join(root, draft)), { recursive: true });
  const write = value => fs.writeFileSync(path.join(root, draft), JSON.stringify(value));
  write(data); return { root, data, draft, write };
}
test('memoria conserva dudas, separa sesiones y detecta fuentes obsoletas', t => {
  const { root, draft } = setup(t);
  checkpoint(root, 'session-a', draft);
  const result = resume(root, 'session-a');
  assert.equal(result.ready, true); assert.deepEqual(result.data.questions, ['¿Quién puede editar?']);
  assert.throws(() => resume(root, 'session-b'), /No hay/);
  assert.throws(() => resume(root, '../session-a'), /Sesión/);
  fs.writeFileSync(path.join(root, 'source.txt'), 'changed');
  assert.equal(resume(root, 'session-a').ready, false);
  assert.throws(() => checkpoint(root, 'session-a', draft), /Fuente cambió/);
});
test('memoria rechaza datos excesivos, fuentes privadas y borradores fuera de sesión', t => {
  const { root, draft, data, write } = setup(t);
  assert.throws(() => checkpoint(root, 'session-a', 'README.md'), /borrador/);
  write({ ...data, summary: 'x'.repeat(17000) });
  assert.throws(() => checkpoint(root, 'session-a', draft), /grande/);
  write({ ...data, sources: [{ reference: '.env', sha256: hash('secret') }] });
  assert.throws(() => checkpoint(root, 'session-a', draft), /privada/);
});
test('memoria no se recupera desde otro proyecto ni si Git la rastrea', t => {
  const { root, draft } = setup(t);
  const saved = checkpoint(root, 'session-a', draft);
  const file = path.join(root, saved.checkpoint);
  const record = JSON.parse(fs.readFileSync(file)); record.project = 'other';
  fs.writeFileSync(file, JSON.stringify(record));
  assert.throws(() => resume(root, 'session-a'), /otro proyecto/);
  execFileSync('git', ['-C', root, 'add', '-f', saved.checkpoint]);
  assert.throws(() => resume(root, 'session-a'), /rastreados/);
});
test('retomar carga solo el último checkpoint y el runtime instalado funciona solo', t => {
  const { root, draft, data, write } = setup(t);
  checkpoint(root, 'session-a', draft);
  write({ ...data, summary: 'Segundo resumen', questions: ['Sigue pendiente la autorización'] });
  checkpoint(root, 'session-a', draft);
  const output = JSON.parse(execFileSync(process.execPath, [path.join(root, '.cardenal/cli.mjs'), 'resume', root, 'session-a'], { encoding: 'utf8' }));
  assert.equal(output.data.summary, 'Segundo resumen');
  assert.equal(output.checkpointsOnDisk, 2); assert.equal(output.checkpointsLoaded, 1);
  assert.equal(execFileSync('git', ['-C', root, 'status', '--porcelain', '--', 'user-memory'], { encoding: 'utf8' }).trim(), '');
});

test('memoria v2 rechaza formato anterior y fuentes dentro de user-memory', t => {
  const { root, draft, data, write } = setup(t);
  const saved = checkpoint(root, 'session-a', draft);
  const file = path.join(root, saved.checkpoint);
  const record = JSON.parse(fs.readFileSync(file));
  assert.equal(record.schemaVersion, 2);
  assert.equal(Object.hasOwn(record, 'developer'), false);
  record.schemaVersion = 1;
  fs.writeFileSync(file, JSON.stringify(record));
  assert.throws(() => resume(root, 'session-a'), /formato/);
  write({ ...data, sources: [{ reference: draft, sha256: hash('fixture') }] });
  assert.throws(() => checkpoint(root, 'session-a', draft), /privada/);
});
