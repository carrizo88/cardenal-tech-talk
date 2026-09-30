import fs from 'node:fs';
import { inside, rootPath, hash, validate, technicalDoc } from './core.mjs';

export const roles = ['analyst', 'front', 'back', 'testing'];
const states = ['backlog', 'ready', 'active', 'review', 'blocked', 'done'];
const text = value => typeof value === 'string' && !!value.trim();
function shared(root, file) {
  if (!technicalDoc(file) && (!text(file) || file.split('/').some(p => !p || (p.startsWith('.') && p !== '.cardenal') || ['user-memory', 'private', 'node_modules', 'dist', 'build'].includes(p) || /secret|credential|\.pem$|\.key$/i.test(p)))) throw new Error('Referencia privada o generada');
  return inside(root, file);
}
export function validateBoard(target) {
  const root = rootPath(target);
  const board = JSON.parse(fs.readFileSync(inside(root, '.cardenal/board.json'), 'utf8').replace(/^\uFEFF/, ''));
  const errors = [];
  if (board.schemaVersion !== 1 || !Array.isArray(board.tasks)) return { valid: false, errors: ['Se requiere schemaVersion 1 y tasks.'] };
  const tasks = new Map();
  for (const task of board.tasks) {
    if (!task || !text(task.id) || tasks.has(task.id)) errors.push('Cada tarjeta necesita un ID único.');
    else tasks.set(task.id, task);
  }
  if (errors.length) return { valid: false, errors };
  const workflow = board.workflow;
  const qa = workflow?.qa;
  const automatedQA = qa?.mode === 'automated';
  if (qa && (!['manual', 'automated'].includes(qa.mode) || (automatedQA && (!text(qa.requestReference) || typeof qa.browser !== 'boolean')) || (qa.mode === 'manual' && qa.browser === true))) errors.push('QA requiere modo manual o automated; automatización requiere requestReference del usuario y browser booleano.');
  if (!automatedQA && ((Array.isArray(workflow?.roles) && workflow.roles.includes('testing')) || board.tasks.some(t => t.role === 'testing' || (Array.isArray(t.reviews) && t.reviews.some(r => r?.role === 'testing'))))) errors.push('El rol testing requiere QA automatizado solicitado para esta feature.');
  if (automatedQA && !(Array.isArray(workflow?.roles) && workflow.roles.includes('testing'))) errors.push('QA automatizado requiere seleccionar el rol testing.');
  if (board.agreements?.lead || board.agreements?.infra) errors.push('Migrar acuerdos legacy: el team lead es el usuario; no hay agentes lead ni infra.');
  if (workflow) {
    if (!['light', 'standard'].includes(workflow.mode) || !text(workflow.reason) || !Array.isArray(workflow.roles) || !workflow.roles.length || workflow.roles.some(r => !roles.includes(r)) || new Set(workflow.roles).size !== workflow.roles.length || !Array.isArray(workflow.questions) || workflow.questions.some(q => !text(q))) {
      return { valid: false, errors: ['workflow requiere mode, reason, roles únicos válidos y questions.'] };
    }
    if (board.tasks.some(t => !workflow.roles.includes(t.role))) errors.push('Hay tarjetas asignadas a roles no seleccionados.');
    if (workflow.questions.length && board.tasks.some(t => ['ready', 'active', 'review', 'done'].includes(t.state))) errors.push('Resolver con el usuario las dudas sobre roles antes de asignar o avanzar.');
  }
  const reference = (ref, label) => {
    try {
      if (!ref || !text(ref.path) || !/^[a-f0-9]{64}$/.test(ref.sha256 ?? '')) throw new Error('Falta ruta/hash');
      if (hash(fs.readFileSync(shared(root, ref.path))) !== ref.sha256) throw new Error('Fuente obsoleta');
    } catch { errors.push(`${label}: evidencia ausente, privada o modificada.`); }
  };
  for (const task of tasks.values()) {
    const fail = message => errors.push(`${task.id}: ${message}`);
    if (!text(task.title) || !text(task.acceptance) || !roles.includes(task.role) || !states.includes(task.state)) fail('Título, aceptación, rol o estado inválido.');
    for (const field of ['dependsOn', 'files', 'questions', 'evidence', 'reviews']) if (!Array.isArray(task[field])) fail(`${field} debe ser una lista.`);
    if (['dependsOn', 'files', 'questions', 'evidence', 'reviews'].some(f => !Array.isArray(task[f]))) continue;
    if (!task.files.length) fail('Indicar archivos o directorios asignados.');
    for (const file of task.files) { try { shared(root, file); } catch { fail('Archivo asignado inválido o privado.'); } }
    for (const id of task.dependsOn) {
      if (!tasks.has(id) || id === task.id) fail('Dependencia inexistente o propia.');
      else if (['ready', 'active', 'review', 'done'].includes(task.state) && tasks.get(id).state !== 'done') fail(`Dependencia ${id} sin terminar.`);
    }
    if (task.questions.some(q => !text(q))) fail('Las dudas deben tener texto explícito.');
    if (['ready', 'active', 'review', 'done'].includes(task.state) && task.questions.length) fail('Resolver dudas bloqueantes antes de avanzar.');
    if (task.state === 'blocked' && !task.questions.length) fail('Registrar el bloqueo como pregunta.');
    task.evidence.forEach(e => reference(e, task.id));
    for (const review of task.reviews) {
      const human = review?.kind === 'human' && text(review.reviewer) && text(review.reference) && review.role === undefined;
      const agent = review && (review.kind === undefined || review.kind === 'agent') && roles.includes(review.role) && review.role !== task.role;
      if ((!human && !agent) || !['approved', 'changes-requested'].includes(review?.verdict)) fail('Revisión inválida: indicar otro rol o revisión humana con reviewer y reference reales.');
      else reference(review.evidence, `${task.id}/revisión`);
    }
    if (['review', 'done'].includes(task.state) && !task.evidence.length) fail('Entrega sin evidencia.');
    if (task.state === 'done' && (!task.reviews.some(r => r?.kind === 'human' && r?.verdict === 'approved') || task.reviews.some(r => r?.verdict === 'changes-requested'))) fail('Cierre requiere check final humano explícito sin cambios pendientes; QA no lo reemplaza.');
  }
  const visiting = new Set(), visited = new Set();
  function visit(id) {
    if (visiting.has(id)) { errors.push(`Dependencias cíclicas en ${id}.`); return; }
    if (visited.has(id)) return;
    visiting.add(id);
    const dependencies = tasks.get(id)?.dependsOn;
    for (const dep of Array.isArray(dependencies) ? dependencies : []) if (tasks.has(dep)) visit(dep);
    visiting.delete(id); visited.add(id);
  }
  for (const id of tasks.keys()) visit(id);
  const active = board.tasks.filter(t => t.state === 'active' && Array.isArray(t.files));
  const overlaps = (a, b) => a === b || a.startsWith(b + '/') || b.startsWith(a + '/');
  for (let a = 0; a < active.length; a++) for (let b = a + 1; b < active.length; b++) {
    if (active[a].files.some(x => typeof x === 'string' && active[b].files.some(y => typeof y === 'string' && overlaps(x.toLowerCase(), y.toLowerCase())))) errors.push(`${active[a].id}/${active[b].id}: archivos activos superpuestos; serializar o aislar checkouts.`);
  }
  if (board.tasks.some(t => ['ready', 'active', 'review', 'done'].includes(t.state))) {
    const context = validate(root);
    if (!context.ready) errors.push('El contexto compartido tiene errores o preguntas bloqueantes.');
    if (workflow?.mode !== 'light') reference(board.agreements?.analyst, 'Acuerdo analyst');
  }
  return { valid: !errors.length, errors, counts: Object.fromEntries(states.map(s => [s, board.tasks.filter(t => t.state === s).length])),
    note: 'Valida consistencia y hashes, no la autenticidad de revisiones ni la ejecución de agentes o pruebas.' };
}

export function taskPackage(target, id) {
  const root = rootPath(target);
  const result = validateBoard(root);
  if (!result.valid) throw new Error(result.errors.join('\n'));
  const board = JSON.parse(fs.readFileSync(inside(root, '.cardenal/board.json'), 'utf8').replace(/^\uFEFF/, ''));
  const task = board.tasks.find(t => t.id === id);
  if (!task || !['ready', 'active'].includes(task.state)) throw new Error('Elegir una tarjeta ready o active.');
  return { task, workflow: board.workflow, agreements: board.workflow?.mode === 'light' ? undefined : board.agreements, context: '.cardenal/context.json', roleGuide: '.cardenal/team.md',
    instructions: 'Leer solo fuentes pertinentes y el contrato del rol. Registrar dudas nuevas como bloqueo. Entregar archivos, evidencia y pendientes; no copiar user-memory a artefactos compartidos. Este comando no ejecuta un agente ni cambia el tablero.' };
}
