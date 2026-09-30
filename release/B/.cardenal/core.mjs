import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const templateDir = fs.existsSync(path.join(here, 'templates')) ? path.join(here, 'templates') : path.join(here, '../templates');
const excluded = new Set(['user-memory', '.git', '.local', 'node_modules', 'dist', 'build', 'coverage', '.next', '.venv']);
export const hash = value => createHash('sha256').update(value).digest('hex');
const json = value => JSON.stringify(value, null, 2) + '\n';
const nonempty = value => typeof value === 'string' && value.trim().length > 0;
const exists = file => fs.existsSync(file);
const read = file => fs.readFileSync(file, 'utf8');
export const normalizeEol = value => value.replace(/\r\n/g, '\n');
export const stages = ['repositorio', 'relevamiento', 'seleccion-roles', 'implementacion', 'verificacion', 'cierre'];
export function stagePrompt(target, stage) {
  if (!stages.includes(stage)) throw new Error(`Etapa inválida. Usar: ${stages.join(', ')}.`);
  return read(inside(rootPath(target), `.cardenal/prompts/${stage}.md`));
}

export function rootPath(target) {
  const root = fs.realpathSync(target);
  if (!fs.statSync(root).isDirectory()) throw new Error('El destino debe ser un directorio existente.');
  return root;
}

// No atravesar enlaces ni aceptar rutas ajenas al proyecto, incluso en fuentes.
export function inside(root, relative) {
  if (!nonempty(relative) || path.isAbsolute(relative) || relative.includes('\\') || relative.split('/').some(x => x === '..' || x === '.')) {
    throw new Error(`Ruta relativa inválida: ${relative}`);
  }
  const parts = relative.split('/');
  let current = root;
  for (const part of parts) {
    current = path.join(current, part);
    try {
      if (fs.lstatSync(current).isSymbolicLink()) throw new Error(`Enlace no permitido: ${relative}`);
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  return current;
}

function privatePath(relative) {
  return relative.split('/').some(p => excluded.has(p) || p === 'private' || p.startsWith('.env') || /secret|credential|\.pem$|\.key$/i.test(p));
}

export function technicalDoc(relative) {
  return typeof relative === 'string' && /^doc\/(?:tech|private)\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+\.md$/.test(relative) && !/secret|credential/i.test(relative);
}

export function inventory(target) {
  const root = rootPath(target);
  const files = [];
  let truncated = false;
  function walk(dir, prefix = '', depth = 0) {
    if (depth > 8) { truncated = true; return; }
    for (const item of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const rel = prefix + item.name;
      if (privatePath(rel) || item.isSymbolicLink()) continue;
      if (files.length >= 600) { truncated = true; return; }
      if (item.isDirectory()) walk(path.join(dir, item.name), rel + '/', depth + 1);
      else if (item.isFile()) files.push(rel);
    }
  }
  walk(root);
  return { files, truncated, note: 'Inventario de rutas; no infiere stack, negocio ni resultados de pruebas.' };
}

const emptyContext = () => ({
  schemaVersion: 1,
  sources: [],
  facts: [],
  questions: [],
  change: { actor: '', problem: '', outcome: '', scope: '', acceptance: '', valueSignal: '', evidence: [] }
});

export function integrate(target, { dryRun = false } = {}) {
  const root = rootPath(target);
  // No ocultar datos privados ya versionados mediante una nueva regla de ignore.
  try {
    const tracked = execFileSync('git', ['-C', root, 'ls-files', '--', 'doc/private', '.local/sdd', 'user-memory'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    if (tracked.trim()) throw new Error('Hay archivos privados ya rastreados por Git. Revisarlos antes de integrar.');
  } catch (error) {
    if (error.message.startsWith('Hay archivos')) throw error;
    if (error.code !== 'ENOENT' && !String(error.stderr).includes('not a git repository')) throw error;
  }
  const generated = new Map([
    ['.cardenal/core.mjs', read(path.join(here, 'core.mjs'))],
    ['.cardenal/cli.mjs', read(path.join(here, 'cli.mjs'))],
    ['.cardenal/memory.mjs', read(path.join(here, 'memory.mjs'))],
    ['.cardenal/team.mjs', read(path.join(here, 'team.mjs'))],
    ['.cardenal/usage.mjs', read(path.join(here, 'usage.mjs'))],
    ['.cardenal/adapters.mjs', read(path.join(here, 'adapters.mjs'))],
    ['.cardenal/onboarding.mjs', read(path.join(here, 'onboarding.mjs'))],
    ['.cardenal/templates/inicializate.md', read(path.join(templateDir, 'inicializate.md'))],
    ['.cardenal/templates/ficha-mvp-del-equipo.md', read(path.join(templateDir, 'ficha-mvp-del-equipo.md'))],
    ['.cardenal/templates/feature.md', read(path.join(templateDir, 'feature.md'))],
    ['.claude/skills/feature/SKILL.md', read(path.join(templateDir, 'feature.md'))],
    ['.agents/skills/feature/SKILL.md', read(path.join(templateDir, 'feature.md'))],
    ['.github/skills/feature/SKILL.md', read(path.join(templateDir, 'feature.md'))],
    ['.claude/skills/inicializate/SKILL.md', read(path.join(templateDir, 'inicializate.md'))],
    ['.agents/skills/inicializate/SKILL.md', read(path.join(templateDir, 'inicializate.md'))],
    ['.github/skills/inicializate/SKILL.md', read(path.join(templateDir, 'inicializate.md'))],
    ['.cardenal/team.md', read(path.join(templateDir, 'team.md'))],
    ['.cardenal/templates/team.md', read(path.join(templateDir, 'team.md'))],
    ['.claude/skills/cardenal-relevar/SKILL.md', read(path.join(templateDir, 'SKILL.md'))],
    ['.cardenal/README.md', read(path.join(templateDir, 'context-guide.md'))],
    ['.cardenal/templates/SKILL.md', read(path.join(templateDir, 'SKILL.md'))],
    ['.cardenal/templates/context-guide.md', read(path.join(templateDir, 'context-guide.md'))]
  ]);
  for (const stage of stages) {
    const content = read(path.join(templateDir, `prompts/${stage}.md`));
    generated.set(`.cardenal/prompts/${stage}.md`, content);
    generated.set(`.cardenal/templates/prompts/${stage}.md`, content);
  }
  for (const relative of ['schema.yaml', 'templates/proposal.md', 'templates/spec.md', 'templates/design.md', 'templates/tasks.md']) {
    const content = read(path.join(templateDir, `schemas/cardenal/${relative}`));
    generated.set(`openspec/schemas/cardenal/${relative}`, content);
    generated.set(`.cardenal/templates/schemas/cardenal/${relative}`, content);
  }
  const config = 'openspec/config.yaml';
  if (!exists(inside(root, config))) generated.set(config, [
    'schema: cardenal',
    'context: |',
    '  Cardenal: consultar .cardenal/context.json y su README para el cambio activo.',
    '  Los hechos observados no equivalen a reglas deseadas. Resolver dudas bloqueantes.',
    '  Cargar sólo fuentes pertinentes; no copiar documentación privada a artefactos compartidos.',
    'rules:',
    '  proposal:',
    '    - Explicar actor, problema, valor esperado y fuentes; identificar hipótesis.',
    '  specs:',
    '    - Enlazar decisiones confirmadas y escenarios verificables; no inventar políticas.',
    '  tasks:',
    '    - Relacionar tareas con escenarios y registrar evidencia real de verificación.', ''
  ].join('\n'));
  // Empty scaffolds are created once; the assistant fills them from observed sources.
  const documents = {
    'doc/private/README.md': '# Documentación confidencial local\n\nCarpeta ignorada por Git. Puede contener reglas comerciales confidenciales, acuerdos internos y fichas de bibliotecas propietarias en dependencies/. No guardar claves, tokens ni datos personales reales. La documentación técnica compartible vive en ../tech/. No publicar contenido de esta carpeta sin autorización.\n',
    'doc/public/README.md': '# Documentación del producto\n\nEstado: pendiente de relevamiento.\n\n- [Funcionalidades](funcionalidades.md)\n',
    'doc/public/funcionalidades.md': '# Funcionalidades\n\nEstado: pendiente de relevamiento. Describir usuarios, objetivos, reglas y límites en lenguaje de producto. No afirmar capacidades no observadas.\n',
    'doc/tech/README.md': '# Documentación técnica\n\nEstado: pendiente de relevamiento.\n\n- [Dominio e integración](sistema.md)\n- [Dependencias](dependencies/README.md)\n',
    'doc/tech/sistema.md': '# Dominio e integración\n\nEstado: pendiente de relevamiento. Documentar módulos, contratos, datos, autenticación, reglas y límites con referencias al código. Sin secretos.\n',
    'doc/tech/dependencies/README.md': '# Dependencias\n\nEstado: pendiente de relevamiento. Registrar propósito, versión observada, puntos de uso y enlaces a fichas breves. Preguntar por bibliotecas propias o que necesiten atención especial.\n'
  };
  for (const [relative, content] of Object.entries(documents)) if (!exists(inside(root, relative))) generated.set(relative, content);
  const migrations = [];
  for (const name of ['context.json', 'repository-context.json', 'board.json']) {
    const oldPath = `doc/cardenal/${name}`, newPath = `.cardenal/${name}`;
    if (exists(inside(root, oldPath))) {
      const content = read(inside(root, oldPath));
      JSON.parse(content.replace(/^\uFEFF/, ''));
      if (exists(inside(root, newPath)) && normalizeEol(read(inside(root, newPath))) !== normalizeEol(content)) throw new Error(`Conflicto de migración: ${oldPath} y ${newPath}. No se escribió ningún archivo.`);
      if (!exists(inside(root, newPath))) generated.set(newPath, content);
      migrations.push(oldPath);
    }
  }
  const context = '.cardenal/context.json';
  if (!generated.has(context) && !exists(inside(root, context))) generated.set(context, json(emptyContext()));
  if (!generated.has('.cardenal/repository-context.json') && !exists(inside(root, '.cardenal/repository-context.json'))) generated.set('.cardenal/repository-context.json', json({ schemaVersion: 1, sources: [], facts: [], questions: [] }));
  if (!generated.has('.cardenal/board.json') && !exists(inside(root, '.cardenal/board.json'))) generated.set('.cardenal/board.json', json({ schemaVersion: 1, agreements: {}, tasks: [] }));

  const actions = [];
  for (const [relative, content] of generated) {
    const file = inside(root, relative);
    if (exists(file)) {
      if (normalizeEol(read(file)) !== normalizeEol(content)) throw new Error(`Conflicto: ${relative} ya tiene contenido diferente. No se escribió ningún archivo.`);
    } else actions.push({ path: relative, content });
  }
  const ignoreFile = inside(root, '.gitignore');
  let ignore = exists(ignoreFile) ? read(ignoreFile) : '';
  const originalIgnore = ignore;
  // Al final para prevalecer sobre negaciones previas en este archivo.
  const block = '# Cardenal: estado local y documentación privada\n/.local/sdd/\n/user-memory/\n/doc/private/\n';
  if (!normalizeEol(ignore).endsWith(block)) ignore += (ignore && !ignore.endsWith('\n') ? '\n' : '') + block;
  if (ignore !== originalIgnore) actions.push({ path: '.gitignore', content: ignore, update: exists(ignoreFile) });
  if (!dryRun) {
    for (const action of actions) {
      const file = inside(root, action.path);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, action.content, { flag: action.update ? 'w' : 'wx' });
    }
  }
  if (!dryRun) for (const oldPath of migrations) fs.unlinkSync(inside(root, oldPath));
  return { dryRun, migrated: migrations, changes: actions.map(({ path: p, update }) => ({ path: p, operation: update ? 'append-ignore' : 'create' })),
    note: 'No modifica CLAUDE.md, AGENTS.md ni configuración OpenSpec existente. No instala ni ejecuta OpenSpec. Si ya había config, integrar las reglas mediante revisión manual.' };
}

export function validate(target, { scope = 'change' } = {}) {
  if (!['change', 'repository'].includes(scope)) throw new Error('Ámbito de validación inválido.');
  const root = rootPath(target);
  const data = JSON.parse(read(inside(root, scope === 'repository' ? '.cardenal/repository-context.json' : '.cardenal/context.json')).replace(/^\uFEFF/, ''));
  const errors = [], blockers = [];
  const error = message => errors.push(message);
  if (data.schemaVersion !== 1) error('schemaVersion debe ser 1.');
  for (const key of ['sources', 'facts', 'questions']) if (!Array.isArray(data[key])) error(`${key} debe ser una lista.`);
  if (errors.length) return { valid: false, ready: false, errors, blockers };
  const allIds = new Set();
  for (const item of [...data.sources, ...data.facts, ...data.questions]) {
    if (!item || !nonempty(item.id) || allIds.has(item.id)) error('Cada entrada necesita un ID único.');
    else allIds.add(item.id);
  }
  if (errors.length) return { valid: false, ready: false, errors, blockers };
  const sources = new Map(data.sources.map(s => [s.id, s]));
  for (const source of data.sources) {
    if (!['user', 'file'].includes(source.kind) || !nonempty(source.reference)) error(`${source.id}: tipo/referencia de fuente inválidos.`);
    if (source.kind === 'file') {
      try {
        if (privatePath(source.reference) && !technicalDoc(source.reference)) throw new Error('fuente privada o sensible no permitida en este registro compartido');
        const file = inside(root, source.reference);
        if (!fs.statSync(file).isFile()) throw new Error('no es archivo');
        if (hash(fs.readFileSync(file)) !== source.sha256) throw new Error('hash ausente u obsoleto');
      } catch (e) { error(`${source.id}: ${e.message}`); }
    }
  }
  const facts = new Map(data.facts.map(f => [f.id, f]));
  for (const fact of data.facts) {
    if (!['product', 'technical'].includes(fact.area) || !nonempty(fact.statement)) error(`${fact.id}: área o afirmación inválida.`);
    if (!['confirmed', 'observed', 'proposed', 'superseded'].includes(fact.status)) error(`${fact.id}: estado inválido.`);
    const source = sources.get(fact.source);
    if (fact.status === 'confirmed' && source?.kind !== 'user') error(`${fact.id}: confirmado requiere una fuente de usuario.`);
    if (fact.status === 'observed' && source?.kind !== 'file') error(`${fact.id}: observado requiere una fuente de archivo.`);
    if (fact.source && !source) error(`${fact.id}: fuente inexistente.`);
    if (fact.status === 'superseded' && (!facts.has(fact.replacedBy) || fact.replacedBy === fact.id || facts.get(fact.replacedBy)?.status === 'superseded')) error(`${fact.id}: indicar reemplazo vigente.`);
  }
  for (const question of data.questions) {
    if (!nonempty(question.question) || typeof question.blocking !== 'boolean' || !['open', 'resolved', 'deferred'].includes(question.status)) error(`${question.id}: pregunta inválida.`);
    if (question.status === 'resolved') {
      const answer = facts.get(question.resolution);
      if (!answer || answer.status !== 'confirmed') error(`${question.id}: resolución debe referenciar una decisión confirmada.`);
    } else if (question.blocking) blockers.push(`${question.id}: ${question.question}`);
  }
  if (scope === 'repository') {
    for (const area of ['product', 'technical']) if (!data.facts.some(f => f.area === area && ['observed', 'confirmed'].includes(f.status))) blockers.push(`Registrar contexto ${area} con fuente; si falta información, preguntar sobre el repositorio.`);
    return { valid: !errors.length, ready: !errors.length && !blockers.length, scope, errors, blockers, note: 'Relevamiento del repositorio; no requiere feature ni autoriza implementación.' };
  }
  const change = data.change;
  if (!change || typeof change !== 'object' || Array.isArray(change)) error('Falta ficha change.');
  else {
    for (const field of ['actor', 'problem', 'outcome', 'scope', 'acceptance', 'valueSignal']) if (!nonempty(change[field])) blockers.push(`Completar change.${field}.`);
    if (!Array.isArray(change.evidence)) error('change.evidence debe ser una lista de IDs de hechos.');
    else {
      for (const id of change.evidence) if (!facts.has(id) || !['confirmed', 'observed'].includes(facts.get(id).status)) error(`Evidencia de cambio no vigente o no confirmada/observada: ${id}`);
      const chosen = change.evidence.map(id => facts.get(id)).filter(Boolean);
      if (!chosen.some(f => f.area === 'product' && f.status === 'confirmed')) blockers.push('Falta evidencia confirmada de producto para este cambio.');
      if (!chosen.some(f => f.area === 'technical' && f.status === 'observed')) blockers.push('Falta evidencia técnica observada para este cambio.');
    }
  }
  return { valid: !errors.length, ready: !errors.length && !blockers.length, errors, blockers,
    note: 'Ready indica consistencia estructural para revisión. No demuestra veracidad, suficiencia semántica ni aprobación humana del cambio.' };
}
