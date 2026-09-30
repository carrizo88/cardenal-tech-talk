import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { initialize } from '../src/onboarding.mjs';

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cardenal-onboard-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}
const options = { assistant: 'claude', session: 'inicio' };
test('sin identidad pregunta sin escribir; dry-run tampoco escribe', t => {
  const root = fixture(t);
  assert.ok(initialize(root).questions.length);
  assert.equal(initialize(root, { assistant: 'claude', dryRun: true }).session, 'inicio');
  assert.equal(initialize(root, { ...options, dryRun: true }).initializeOpenSpec, true);
  assert.deepEqual(fs.readdirSync(root), []);
  assert.throws(() => initialize(root, { ...options, session: '../otro' }), /inválido/);
});
test('prepara proyecto nuevo, preserva config y no reinicializa OpenSpec completo', t => {
  const root = fixture(t);
  fs.mkdirSync(path.join(root, 'openspec'));
  fs.writeFileSync(path.join(root, 'openspec/config.yaml'), 'schema: propio\n');
  let calls = 0;
  const run = (cwd, args) => {
    if (args[0] === '--version') return '1.13.2';
    calls++;
    assert.equal(cwd, root);
    assert.ok(args.includes('--no-copilot-cloud'));
    for (const dir of ['openspec/specs', 'openspec/changes', '.claude/skills/openspec-propose']) fs.mkdirSync(path.join(root, dir), { recursive: true });
    fs.writeFileSync(path.join(root, '.claude/skills/openspec-propose/SKILL.md'), 'fixture');
  };
  assert.equal(initialize(root, { ...options, run }).setupComplete, true);
  initialize(root, { ...options, run });
  assert.equal(calls, 1);
  assert.equal(fs.readFileSync(path.join(root, 'openspec/config.yaml'), 'utf8'), 'schema: propio\n');
  assert.ok(fs.existsSync(path.join(root, 'user-memory/sessions/inicio')));
});
test('error de instalación no declara éxito; integración parcial no se sobrescribe', t => {
  const root = fixture(t);
  assert.throws(() => initialize(root, { ...options, run: () => { throw new Error('sin red'); } }), /sin red/);
  fs.mkdirSync(path.join(root, '.claude/skills/openspec-propose'), { recursive: true });
  assert.throws(() => initialize(root, options), /parcial/);
});
