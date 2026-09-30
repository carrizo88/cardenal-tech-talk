import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync, spawnSync } from 'node:child_process';
import { integrate, inventory, validate, hash } from '../src/core.mjs';

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cardenal-test-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}
function write(root, rel, text) {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), text);
}
function record(root) {
  write(root, 'api.mjs', 'export const capacity = 2;\n');
  return { schemaVersion: 1,
    sources: [{ id: 'U1', kind: 'user', reference: 'Respuesta ficticia de prueba, no evidencia del proyecto' },
      { id: 'S1', kind: 'file', reference: 'api.mjs', sha256: hash(fs.readFileSync(path.join(root, 'api.mjs'))) }],
    facts: [{ id: 'D1', area: 'product', statement: 'Caso ficticio: mostrar capacidad', status: 'confirmed', source: 'U1' },
      { id: 'O1', area: 'technical', statement: 'Existe una constante capacity', status: 'observed', source: 'S1' }],
    questions: [],
    change: { actor: 'Operador ficticio', problem: 'No ve capacidad', outcome: 'Ver capacidad', scope: 'Mostrarla', acceptance: 'Muestra 2', valueSignal: 'Hipótesis: evita consultas manuales, no medida', evidence: ['D1', 'O1'] }
  };
}
function save(root, value) { write(root, '.cardenal/context.json', JSON.stringify(value)); }

test('dry-run no escribe; init preserva instrucciones y config; repetir no duplica', t => {
  const root = fixture(t);
  write(root, 'CLAUDE.md', 'Convenciones propias');
  write(root, 'AGENTS.md', 'Instrucciones existentes');
  write(root, 'openspec/config.yaml', 'schema: equipo-propio\n');
  assert.ok(integrate(root, { dryRun: true }).changes.length);
  assert.equal(fs.existsSync(path.join(root, '.cardenal')), false);
  integrate(root);
  assert.equal(fs.readFileSync(path.join(root, 'CLAUDE.md'), 'utf8'), 'Convenciones propias');
  assert.equal(fs.readFileSync(path.join(root, 'openspec/config.yaml'), 'utf8'), 'schema: equipo-propio\n');
  assert.deepEqual(integrate(root).changes, []);
  const value = record(root); save(root, value);
  assert.deepEqual(integrate(root).changes, []);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(root, '.cardenal/context.json'))), value);
});

test('conflicto previo aborta antes de crear archivos', t => {
  const root = fixture(t);
  write(root, '.claude/skills/cardenal-relevar/SKILL.md', 'Personalización local');
  assert.throws(() => integrate(root), /Conflicto/);
  assert.equal(fs.existsSync(path.join(root, '.cardenal')), false);
  assert.equal(fs.existsSync(path.join(root, '.gitignore')), false);
});

test('JSON vacío está bloqueado; evidencia conectada permite revisión', t => {
  const root = fixture(t); integrate(root);
  assert.equal(validate(root).valid, true);
  assert.equal(validate(root).ready, false);
  save(root, record(root));
  assert.equal(validate(root).ready, true);
});

test('pregunta pendiente o pospuesta bloquea; resolución exige decisión confirmada', t => {
  const root = fixture(t); const value = record(root);
  value.questions = [{ id: 'Q1', question: '¿Quién accede?', blocking: true, status: 'open' }];
  save(root, value); assert.equal(validate(root).ready, false);
  value.questions[0].status = 'deferred'; save(root, value); assert.equal(validate(root).ready, false);
  value.questions[0].status = 'resolved'; value.questions[0].resolution = 'O1';
  save(root, value); assert.equal(validate(root).valid, false);
  value.questions[0].resolution = 'D1'; save(root, value); assert.equal(validate(root).ready, true);
});

test('propuestas, referencias inventadas y archivos obsoletos no habilitan el cambio', t => {
  const root = fixture(t); const value = record(root);
  value.facts[0].status = 'proposed'; save(root, value); assert.equal(validate(root).ready, false);
  value.facts[0].status = 'confirmed'; value.facts[0].source = 'inexistente';
  save(root, value); assert.equal(validate(root).valid, false);
  value.facts[0].source = 'U1'; save(root, value);
  write(root, 'api.mjs', 'export const capacity = 3;');
  assert.equal(validate(root).valid, false);
});

test('IDs duplicados, decisiones reemplazadas y JSON mal formado fallan', t => {
  const root = fixture(t); const value = record(root);
  value.questions = [{ id: 'D1', question: 'Duplicado', blocking: false, status: 'open' }];
  save(root, value); assert.equal(validate(root).valid, false);
  value.questions = []; value.facts[0].status = 'superseded'; value.facts[0].replacedBy = 'D1';
  save(root, value); assert.equal(validate(root).valid, false);
  write(root, '.cardenal/context.json', '{'); assert.throws(() => validate(root));
});

test('inventario excluye privados; fuentes no pueden escapar ni referenciar secretos', t => {
  const root = fixture(t); const value = record(root);
  write(root, 'doc/private/negocio.md', 'privado'); write(root, '.env', 'SECRET=valor');
  write(root, '.local/sdd/session.json', '{}'); write(root, 'user-memory/session.json', '{}');
  assert.deepEqual(inventory(root).files, ['api.mjs']);
  for (const reference of ['../otro.md', '.env', 'doc/private/credentials.md', 'user-memory/session.json', 'C:\\otro.md']) {
    value.sources[1].reference = reference; save(root, value);
    assert.equal(validate(root).valid, false);
  }
});

test('Git ignora privados y rechaza privados ya rastreados', t => {
  const root = fixture(t);
  execFileSync('git', ['init', '-q', root]);
  integrate(root);
  for (const rel of ['doc/private/test.txt', '.local/sdd/test.json', 'user-memory/test.json']) {
    write(root, rel, 'ficticio');
    execFileSync('git', ['-C', root, 'check-ignore', '-q', rel]);
  }
  execFileSync('git', ['-C', root, 'add', '-f', 'doc/private/test.txt']);
  assert.throws(() => integrate(root), /ya rastreados/);
});

test('runtime instalado ejecuta validate e integra otro proyecto sin el repo original', t => {
  const root = fixture(t); integrate(root);
  const cli = path.join(root, '.cardenal/cli.mjs');
  const result = spawnSync(process.execPath, [cli, 'validate', root], { encoding: 'utf8' });
  assert.equal(result.status, 2); assert.equal(JSON.parse(result.stdout).ready, false);
  const another = fixture(t);
  const init = spawnSync(process.execPath, [cli, 'init', another], { encoding: 'utf8' });
  assert.equal(init.status, 0, init.stderr);
  assert.ok(fs.existsSync(path.join(another, '.claude/skills/cardenal-relevar/SKILL.md')));
});

test('no atraviesa enlaces simbólicos al escribir o leer', t => {
  const root = fixture(t), outside = fixture(t);
  try { fs.symlinkSync(outside, path.join(root, 'doc'), 'junction'); }
  catch (error) { if (error.code === 'EPERM') return t.skip('Sin privilegio de enlace'); throw error; }
  assert.throws(() => integrate(root), /Enlace/);
  assert.deepEqual(fs.readdirSync(outside), []);
});


test('init encapsula JSON, preserva Markdown y migra registros previos sin perder datos', t => {
  const root = fixture(t);
  const legacy = { schemaVersion: 1, sources: [], facts: [], questions: [], marker: 'conservar' };
  write(root, 'doc/cardenal/repository-context.json', JSON.stringify(legacy));
  write(root, 'doc/public/funcionalidades.md', '# Contenido propio');
  integrate(root, { dryRun: true });
  assert.ok(fs.existsSync(path.join(root, 'doc/cardenal/repository-context.json')));
  integrate(root);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(root, '.cardenal/repository-context.json'))), legacy);
  assert.equal(fs.existsSync(path.join(root, 'doc/cardenal/repository-context.json')), false);
  assert.equal(fs.readFileSync(path.join(root, 'doc/public/funcionalidades.md'), 'utf8'), '# Contenido propio');
  assert.ok(fs.existsSync(path.join(root, 'doc/tech/dependencies/README.md')));
  write(root, 'doc/cardenal/repository-context.json', '{}');
  assert.throws(() => integrate(root), /Conflicto de migración/);
});

test('contexto acepta fichas técnicas Markdown, no secretos ni dependencias completas', t => {
  const root = fixture(t); const value = record(root);
  write(root, 'doc/tech/dependencies/auth0.md', '# Contrato observado');
  value.sources[1].reference = 'doc/tech/dependencies/auth0.md';
  value.sources[1].sha256 = hash(fs.readFileSync(path.join(root, value.sources[1].reference)));
  save(root, value); assert.equal(validate(root).valid, true);
  for (const ref of ['doc/private/secrets.md', 'node_modules/pkg/index.js', 'doc/private/../outside.md']) {
    value.sources[1].reference = ref; save(root, value); assert.equal(validate(root).valid, false);
  }
});
