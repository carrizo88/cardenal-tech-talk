import fs from 'node:fs';
import path from 'node:path';
import { inside, rootPath, normalizeEol } from './core.mjs';

export function mapAssistants(target, { dryRun = false } = {}) {
  const root = rootPath(target);
  const blocks = {
    'AGENTS.md': '## Cardenal\nPara relevar el repositorio usar .cardenal/templates/inicializate.md; para trabajar una feature usar .cardenal/templates/feature.md. Inicializate no exige una feature. Trabajar en la rama y checkout actuales; no crear ramas, worktrees o PR ni cambiar ramas o hacer merge salvo pedido explícito. Cargar solo el prompt de la etapa activa en .cardenal/prompts y las fuentes pertinentes; no releer todas las guías. Preguntar dudas que alteren comportamiento o selección de roles antes del trabajo dependiente. No inventar decisiones, pruebas, agentes ni revisiones. Al iniciar una conversación leer doc/public/README.md y doc/tech/README.md si existen, luego solo fichas y dependencies pertinentes. Documentar cada feature implementada en ambas audiencias, no solo en openspec/changes. Los JSON de control viven en .cardenal; la documentación Markdown vive en doc/public y doc/tech; doc/private queda local e ignorado por Git para información confidencial; user-memory es local e ignorado por Git. No copiar secretos ni transcripciones. Validar estructura y comportamiento por separado. Solo contadores del proveedor acreditan consumo de tokens.',
    'CLAUDE.md': '@AGENTS.md\n\nCardenal: importación compatible para sesiones que no cargan AGENTS.md directamente. No duplicar el contenido común aquí.',
    '.github/copilot-instructions.md': 'Para el workflow de Cardenal, leer [AGENTS.md](../AGENTS.md) en la raíz del repositorio. Mantener allí las reglas comunes; no copiar la memoria privada en instrucciones compartidas.'
  };
  const begin = '<!-- cardenal:adapter:start -->', end = '<!-- cardenal:adapter:end -->';
  const actions = [];
  for (const [relative, content] of Object.entries(blocks)) {
    const file = inside(root, relative);
    const original = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
    const block = `${begin}\n${content}\n${end}\n`;
    if (original.includes(begin) || original.includes(end)) {
      if (!normalizeEol(original).includes(normalizeEol(block))) throw new Error(`Bloque existente diferente en ${relative}; revisar antes de cambiarlo.`);
    } else actions.push({ relative, file, content: original + (original && !original.endsWith('\n') ? '\n' : '') + '\n' + block });
  }
  if (!dryRun) for (const action of actions) { fs.mkdirSync(path.dirname(action.file), { recursive: true }); fs.writeFileSync(action.file, action.content); }
  return { dryRun, changed: actions.map(a => a.relative), runtimes: { astra: 'Codex → AGENTS.md', claude: 'Claude Code/Desktop Code → CLAUDE.md imports AGENTS.md; native support depends on version/settings', copilot: 'Copilot → .github/copilot-instructions.md + AGENTS.md where supported' }, note: 'Preserva instrucciones existentes. No cambia modelo, permisos, settings globales ni instala asistentes. Probar descubrimiento en cada entorno.' };
}
