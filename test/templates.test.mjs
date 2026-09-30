import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { integrate, stagePrompt, stages } from '../src/core.mjs';
import { initialize } from '../src/onboarding.mjs';
import { buildCopy } from '../scripts/build-copy.mjs';

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cardenal-templates-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}
test('cada etapa se carga sola; el runtime copiado incluye esquema y rechaza rutas arbitrarias', t => {
  const root = fixture(t);
  buildCopy(root);
  for (const stage of stages) {
    const content = stagePrompt(root, stage);
    assert.ok(content.length > 100);
    assert.equal(execFileSync(process.execPath, [path.join(root, '.cardenal/cli.mjs'), 'prompt', root, stage], { encoding: 'utf8' }).trim(), content.trim());
  }
  assert.throws(() => stagePrompt(root, '../user-memory'), /inválida/);
  integrate(root);
  assert.match(fs.readFileSync(path.join(root, 'openspec/config.yaml'), 'utf8'), /^schema: cardenal/);
  assert.ok(fs.existsSync(path.join(root, 'openspec/schemas/cardenal/templates/spec.md')));
});
test('salida breve omite inventario y conserva preguntas; detalle es explícito', t => {
  const root = fixture(t);
  fs.writeFileSync(path.join(root, 'visible.txt'), 'fixture');
  const brief = initialize(root, { assistant: 'claude', dryRun: true });
  const detail = initialize(root, { assistant: 'claude', dryRun: true, detail: true });
  assert.equal(Object.hasOwn(brief, 'inventory'), false);
  assert.deepEqual(detail.inventory.files, ['visible.txt']);
  assert.ok(initialize(root).questions.length);
  assert.equal(brief.initializeOpenSpec, detail.initializeOpenSpec);
});
test('preserva configuración ajena y rechaza plantillas modificadas antes de escribir', t => {
  const root = fixture(t);
  fs.mkdirSync(path.join(root, 'openspec/schemas/cardenal/templates'), { recursive: true });
  fs.writeFileSync(path.join(root, 'openspec/config.yaml'), 'schema: equipo\n');
  fs.writeFileSync(path.join(root, 'openspec/schemas/cardenal/templates/spec.md'), 'personalización');
  assert.throws(() => integrate(root), /Conflicto/);
  assert.equal(fs.existsSync(path.join(root, '.cardenal')), false);
  assert.equal(fs.readFileSync(path.join(root, 'openspec/config.yaml'), 'utf8'), 'schema: equipo\n');
});

test('CLI breve conserva bloqueos y reserva rutas extensas para --detail', t => {
  const root = fixture(t);
  integrate(root);
  const cli = path.join(root, '.cardenal/cli.mjs');
  const run = (...args) => JSON.parse(execFileSync(process.execPath, [cli, ...args], { encoding: 'utf8' }));
  const brief = run('inspect', root);
  const detailed = run('inspect', root, '--detail');
  assert.equal(brief.fileCount, detailed.files.length);
  assert.equal(Object.hasOwn(brief, 'files'), false);
  const initial = run('init', root);
  assert.equal(initial.changedFiles, 0);
  assert.equal(Object.hasOwn(initial, 'changes'), false);
});
