import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { integrate, validate, hash } from '../src/core.mjs';
import { mapAssistants } from '../src/adapters.mjs';

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cardenal-scope-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}
test('CRLF no genera conflictos ni reescrituras; cambios reales siguen bloqueados', t => {
  const root = fixture(t);
  const files = integrate(root).changes.map(c => c.path);
  files.push(...mapAssistants(root).changed);
  for (const rel of files) {
    const file = path.join(root, rel);
    fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace(/\r?\n/g, '\r\n'));
  }
  const before = fs.readFileSync(path.join(root, 'AGENTS.md'));
  assert.deepEqual(integrate(root).changes, []);
  assert.deepEqual(mapAssistants(root).changed, []);
  assert.deepEqual(fs.readFileSync(path.join(root, 'AGENTS.md')), before);
  fs.appendFileSync(path.join(root, '.cardenal/prompts/repositorio.md'), 'Diferencia real');
  assert.throws(() => integrate(root), /Conflicto/);
});
test('repositorio sin feature puede estar listo; cambio vacío sigue bloqueado', t => {
  const root = fixture(t); integrate(root);
  const file = path.join(root, 'README.md'); fs.writeFileSync(file, 'Producto y técnica observados en fixture');
  const data = { schemaVersion: 1, sources: [{ id: 'S1', kind: 'file', reference: 'README.md', sha256: hash(fs.readFileSync(file)) }], facts: [
    { id: 'P1', area: 'product', status: 'observed', statement: 'Propósito documentado', source: 'S1' },
    { id: 'T1', area: 'technical', status: 'observed', statement: 'Tecnología documentada', source: 'S1' }
  ], questions: [] };
  const record = path.join(root, '.cardenal/repository-context.json'); fs.writeFileSync(record, JSON.stringify(data));
  assert.equal(validate(root, { scope: 'repository' }).ready, true);
  assert.equal(validate(root).ready, false);
  const cli = path.join(root, '.cardenal/cli.mjs');
  assert.equal(JSON.parse(execFileSync(process.execPath, [cli, 'validate-repo', root], { encoding: 'utf8' })).ready, true);
  assert.match(execFileSync(process.execPath, [cli, 'feature', root], { encoding: 'utf8' }), /feature/);
  data.questions.push({ id: 'Q1', question: 'Contradicción de arquitectura', status: 'open', blocking: true });
  fs.writeFileSync(record, JSON.stringify(data));
  assert.equal(validate(root, { scope: 'repository' }).ready, false);
  fs.appendFileSync(file, 'modificado'); assert.equal(validate(root, { scope: 'repository' }).valid, false);
});
