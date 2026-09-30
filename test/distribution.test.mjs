import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { buildCopy } from '../scripts/build-copy.mjs';
import { initialize } from '../src/onboarding.mjs';

test('B reemplaza agentes, preserva negocio y gitignore, y arranca sin distribución A', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cardenal-copy-test-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.writeFileSync(path.join(root, 'AGENTS.md'), 'instrucciones previas');
  fs.writeFileSync(path.join(root, '.gitignore'), 'archivo-propio\n');
  fs.mkdirSync(path.join(root, '.cardenal'), { recursive: true });
  fs.writeFileSync(path.join(root, '.cardenal/context.json'), '{"negocio":"conservar"}');
  const built = buildCopy(root);
  assert.ok(!built.files.includes('.gitignore'));
  assert.ok(!built.files.some(p => p.endsWith('.json')));
  assert.ok(!built.files.some(p => p.startsWith('doc/')));
  assert.match(fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8'), /inicializate/);
  assert.doesNotMatch(fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8'), /instrucciones previas/);
  const output = execFileSync(process.execPath, [path.join(root, '.cardenal/cli.mjs'), 'inicializate', root, 'claude', '--dry-run'], { encoding: 'utf8' });
  assert.equal(JSON.parse(output).session, 'inicio');
  initialize(root, { assistant: 'claude', run: () => 'fixture' });
  assert.equal(fs.readFileSync(path.join(root, '.cardenal/context.json'), 'utf8'), '{"negocio":"conservar"}');
  assert.match(fs.readFileSync(path.join(root, '.gitignore'), 'utf8'), /^archivo-propio\n/);
  execFileSync('git', ['-C', root, 'check-ignore', '-q', 'user-memory/sessions/inicio/checkpoint.json']);
});
