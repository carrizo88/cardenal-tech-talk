import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { integrate, hash } from '../src/core.mjs';
import { validateBoard, taskPackage } from '../src/team.mjs';

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cardenal-team-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  integrate(root);
  fs.writeFileSync(path.join(root, 'evidence.md'), 'Fixture: evidencia ficticia, no validación real del producto.');
  const ref = { path: 'evidence.md', sha256: hash(fs.readFileSync(path.join(root, 'evidence.md'))) };
  const context = { schemaVersion: 1, sources: [{ id: 'U', kind: 'user', reference: 'Respuesta ficticia' }, { id: 'F', kind: 'file', reference: ref.path, sha256: ref.sha256 }],
    facts: [{ id: 'P', area: 'product', statement: 'Regla ficticia', status: 'confirmed', source: 'U' }, { id: 'T', area: 'technical', statement: 'Observación ficticia', status: 'observed', source: 'F' }], questions: [],
    change: { actor: 'Usuario', problem: 'Problema', outcome: 'Resultado', scope: 'Alcance', acceptance: 'Escenario', valueSignal: 'Hipótesis', evidence: ['P', 'T'] } };
  fs.writeFileSync(path.join(root, '.cardenal/context.json'), JSON.stringify(context));
  const task = { id: 'T1', title: 'Fixture', role: 'front', state: 'ready', acceptance: 'Escenario ficticio', dependsOn: [], files: ['src'], questions: [], evidence: [], reviews: [] };
  const board = { schemaVersion: 1, agreements: { analyst: ref }, tasks: [task] };
  const save = () => fs.writeFileSync(path.join(root, '.cardenal/board.json'), JSON.stringify(board));
  save(); return { root, ref, task, board, save };
}
test('paquete de tarea funciona en runtime instalado sin cargar historiales', t => {
  const { root } = fixture(t);
  assert.equal(validateBoard(root).valid, true);
  const result = JSON.parse(execFileSync(process.execPath, [path.join(root, '.cardenal/cli.mjs'), 'task-package', root, 'T1'], { encoding: 'utf8' }));
  assert.equal(result.task.id, 'T1'); assert.equal(result.context, '.cardenal/context.json');
});
test('tablero rechaza dudas, dependencias pendientes y ciclos', t => {
  const { root, task, board, save } = fixture(t);
  task.questions = ['¿Quién accede?']; save(); assert.equal(validateBoard(root).valid, false);
  task.state = 'blocked'; save(); assert.equal(validateBoard(root).valid, true);
  assert.throws(() => taskPackage(root, 'T1'), /ready/);
  task.questions = []; task.state = 'ready'; task.dependsOn = ['T2'];
  board.tasks.push({ ...task, id: 'T2', state: 'backlog', dependsOn: ['T1'] }); save();
  assert.ok(validateBoard(root).errors.some(e => e.includes('cíclicas')));
});
test('tablero detecta archivos activos superpuestos y no bloquea archivos separados', t => {
  const { root, task, board, save } = fixture(t);
  task.state = 'active'; board.tasks.push({ ...task, id: 'T2', role: 'back', files: ['src/api.js'] }); save();
  assert.equal(validateBoard(root).valid, false);
  board.tasks[1].files = ['server']; save(); assert.equal(validateBoard(root).valid, true);
});
test('cerrar exige evidencia vigente y check humano aunque otro agente apruebe', t => {
  const { root, task, ref, save } = fixture(t);
  task.state = 'done'; save(); assert.equal(validateBoard(root).valid, false);
  task.evidence = [ref]; task.reviews = [{ role: 'front', verdict: 'approved', evidence: ref }]; save(); assert.equal(validateBoard(root).valid, false);
  task.reviews[0].role = 'back'; save(); assert.equal(validateBoard(root).valid, false);
  task.reviews.push({ kind: 'human', reviewer: 'Usuario de prueba', reference: 'Check explícito de fixture', verdict: 'approved', evidence: ref }); save(); assert.equal(validateBoard(root).valid, true);
  fs.appendFileSync(path.join(root, 'evidence.md'), 'changed'); assert.equal(validateBoard(root).valid, false);
});

test('light permite revisión humana explícita y rechaza identidad o aprobación incompletas', t => {
  const { root, board, task, ref, save } = fixture(t);
  board.workflow = { mode: 'light', roles: ['front'], reason: 'Presentación', questions: [] };
  board.agreements = {}; task.state = 'done'; task.evidence = [ref];
  task.reviews = [{ kind: 'human', reviewer: 'Persona de prueba', reference: 'Respuesta ficticia explícita para test', verdict: 'approved', evidence: ref }];
  save(); assert.equal(validateBoard(root).valid, true);
  task.reviews[0].reference = ''; save(); assert.equal(validateBoard(root).valid, false);
  task.reviews[0].reference = 'Referencia de test'; task.reviews[0].verdict = 'changes-requested'; save(); assert.equal(validateBoard(root).valid, false);
  task.reviews[0].verdict = 'approved'; task.reviews[0].evidence = { ...ref, path: 'user-memory/revision.md' };
  save(); assert.equal(validateBoard(root).valid, false);
});
test('flujo ligero evita acuerdos duplicados pero bloquea roles dudosos o no seleccionados', t => {
  const { root, board, task, save } = fixture(t);
  board.workflow = { mode: 'light', roles: ['front'], reason: 'Cambio de presentación', questions: [] };
  board.agreements = {}; save();
  assert.equal(validateBoard(root).valid, true);
  assert.equal(taskPackage(root, 'T1').agreements, undefined);
  board.workflow.questions = ['¿Se modifica también el contrato de API?']; save();
  assert.equal(validateBoard(root).valid, false);
  assert.throws(() => taskPackage(root, 'T1'), /dudas sobre roles/);
  board.workflow.questions = []; task.role = 'back'; save();
  assert.equal(validateBoard(root).valid, false);
  task.role = 'front'; task.state = 'done'; save();
  assert.equal(validateBoard(root).valid, false);
});


test('lead e infra no son agentes y los acuerdos anteriores requieren migración', t => {
  const { root, board, task, ref, save } = fixture(t);
  for (const role of ['lead', 'infra']) {
    task.role = role; save(); assert.equal(validateBoard(root).valid, false);
  }
  task.role = 'front'; board.agreements.lead = ref; save();
  assert.ok(validateBoard(root).errors.some(e => e.includes('Migrar acuerdos')));
});

test('QA es manual por defecto y automatización requiere pedido de la feature', t => {
  const { root, board, task, ref, save } = fixture(t);
  board.workflow = { mode: 'standard', roles: ['testing'], reason: 'Pruebas solicitadas', questions: [] };
  task.role = 'testing'; save(); assert.equal(validateBoard(root).valid, false);
  board.workflow.qa = { mode: 'automated', browser: false }; save(); assert.equal(validateBoard(root).valid, false);
  board.workflow.qa.requestReference = 'Pedido explícito de QA para esta feature (fixture)';
  save(); assert.equal(validateBoard(root).valid, true);
  board.workflow.qa.browser = true; save(); assert.equal(validateBoard(root).valid, true);
  task.state = 'done'; task.evidence = [ref]; task.reviews = [{ role: 'back', verdict: 'approved', evidence: ref }];
  save(); assert.equal(validateBoard(root).valid, false);
  task.reviews.push({ kind: 'human', reviewer: 'Usuario fixture', reference: 'Check final fixture', verdict: 'approved', evidence: ref });
  save(); assert.equal(validateBoard(root).valid, true);
  task.reviews[1].verdict = 'changes-requested'; save(); assert.equal(validateBoard(root).valid, false);
  task.state = 'ready'; task.reviews = []; board.workflow.qa = { mode: 'manual', browser: true };
  save(); assert.equal(validateBoard(root).valid, false);
});
