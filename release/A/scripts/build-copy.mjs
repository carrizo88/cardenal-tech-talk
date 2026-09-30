import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { integrate, inside, rootPath } from '../src/core.mjs';
import { mapAssistants } from '../src/adapters.mjs';

// Build only the copyable framework: never include empty business records or a
// replacement .gitignore. The first invocation creates/merges those in place.
export function buildCopy(target) {
  fs.mkdirSync(target, { recursive: true });
  const output = rootPath(target);
  const staging = fs.mkdtempSync(path.join(os.tmpdir(), 'cardenal-copy-build-'));
  const result = integrate(staging);
  mapAssistants(staging);
  const files = [...result.changes.map(c => c.path).filter(p => !p.endsWith('.json') && /^\.(cardenal|claude|agents|github)\//.test(p)), 'AGENTS.md', 'CLAUDE.md', '.github/copilot-instructions.md'];
  for (const relative of files) {
    const destination = inside(output, relative);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(inside(staging, relative), destination);
  }
  fs.writeFileSync(inside(output, 'CARDENAL.md'), '# Cardenal — opción B\n\nCopiar TODO el contenido de esta carpeta, incluidas carpetas ocultas, a la raíz del proyecto. Aceptar el reemplazo de AGENTS.md, CLAUDE.md y .github/copilot-instructions.md: esta variante entrega las instrucciones de Cardenal completas. Para conservar instrucciones previas, usar opción A.\n\nAbrir el proyecto con el asistente y usar /inicializate en Claude Code; en otros asistentes seleccionar la skill inicializate o pedir: «Seguí .cardenal/templates/inicializate.md». El asistente ejecuta el arranque, instala OpenSpec localmente si falta y releva el repositorio sin pedir una feature. Luego usar /feature seguido de la necesidad para iniciar trabajo SDD. Ambos comandos usan la rama y checkout actuales; no crean ramas, worktrees ni PR ni hacen merge sin pedido explícito. No hace falta pegar un prompt largo ni ejecutar otra instalación. Requiere Node >=22, npm, Git y red para la primera descarga.\n\nEl usuario es el team lead; no hay agentes lead ni infraestructura. QA con suite y agente de navegador se activa solo por pedido para cada feature. Por defecto el usuario prueba manualmente; siempre se requiere su check final.\n\nVersionar .cardenal, instrucciones y skills de integración, openspec, doc/public y doc/tech. La ficha del MVP está en .cardenal/templates/ficha-mvp-del-equipo.md. Solo las sesiones locales y doc/private son privados dentro de este flujo; conservar exclusiones habituales de secretos, dependencias y builds.\n\nuser-memory/ es local, ignorado por Git y sin perfiles de desarrollador. Los JSON de control viven en .cardenal; doc/public y doc/tech contienen documentación Markdown vigente y openspec las especificaciones. /inicializate completa funcionalidades y dependencies; /feature actualiza ambas audiencias. doc/private es local para información confidencial. No se importa memoria de versiones anteriores.\n');
  return { files: [...files, 'CARDENAL.md'], output };
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) console.log(JSON.stringify(buildCopy(process.argv[2] ?? '../B'), null, 2));
