import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { inside, rootPath, integrate, inventory } from './core.mjs';
import { mapAssistants } from './adapters.mjs';

export const openspecVersion = '1.13.2';
const assistants = { claude: 'claude', astra: 'codex', codex: 'codex', copilot: 'github-copilot' };
export function runOpenSpec(target, args) {
  const root = rootPath(target);
  const prefix = inside(root, 'user-memory/tools/openspec');
  const git = argv => execFileSync('git', ['-C', root, ...argv], { encoding: 'utf8', stdio: 'pipe' });
  if (git(['ls-files', '--', 'user-memory']).trim()) throw new Error('user-memory contiene archivos rastreados.');
  git(['check-ignore', '--quiet', '--', 'user-memory/tools/openspec/package.json']);
  const packagePath = inside(root, 'user-memory/tools/openspec/node_modules/@fission-ai/openspec/package.json');
  const options = { cwd: root, encoding: 'utf8', timeout: 180000, stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, OPENSPEC_TELEMETRY: '0', DO_NOT_TRACK: '1' } };
  if (!fs.existsSync(packagePath)) {
  const candidates = [process.env.npm_execpath, path.join(path.dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js'), '/usr/share/nodejs/npm/bin/npm-cli.js', '/usr/local/lib/node_modules/npm/bin/npm-cli.js'].filter(Boolean);
  const npm = candidates.find(p => fs.existsSync(p) && path.basename(p) === 'npm-cli.js');
  if (!npm) throw new Error('No se encontró npm-cli.js. Ejecutar mediante npm run cardenal -- … o instalar Node con npm.');
    fs.mkdirSync(prefix, { recursive: true });
    execFileSync(process.execPath, [npm, 'install', '--prefix', prefix, '--save-exact', '--ignore-scripts', '--no-audit', '--no-fund', `@fission-ai/openspec@${openspecVersion}`], options);
  }
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  if (pkg.version !== openspecVersion) throw new Error(`OpenSpec local ${pkg.version} difiere de ${openspecVersion}; revisar la instalación, no se reemplaza automáticamente.`);
  const bin = typeof pkg.bin === 'string' ? pkg.bin : pkg.bin?.openspec;
  const executable = inside(path.dirname(packagePath), bin?.replace(/^\.\//, ''));
  return execFileSync(process.execPath, [executable, ...args], options);
}

export function initialize(target, { assistant, session = 'inicio', dryRun = false, detail = false, run = runOpenSpec } = {}) {
  const root = rootPath(target);
  const detected = [['claude', '.claude'], ['codex', '.agents'], ['copilot', '.github/copilot-instructions.md']].filter(([, p]) => fs.existsSync(inside(root, p))).map(([a]) => a);
  if (!assistant) return { ready: false, candidates: detected, questions: ['¿Qué asistente usás: claude, astra/codex o copilot? Las carpetas existentes no prueban cuál está activo.'] };
  if (!assistants[assistant]) throw new Error('Asistente inválido: claude, astra, codex o copilot.');
  if (!/^[a-z0-9][a-z0-9_-]{0,63}$/.test(session)) throw new Error('Identificador local inválido.');
  // Preflight completo de archivos propios antes de escribir o descargar dependencias.
  integrate(root, { dryRun: true });
  mapAssistants(root, { dryRun: true });
  const local = inside(root, `user-memory/sessions/${session}`);
  const tool = assistants[assistant];
  const skillRoot = tool === 'claude' ? '.claude/skills' : tool === 'codex' ? '.agents/skills' : '.github/skills';
  const initialized = fs.existsSync(inside(root, `${skillRoot}/openspec-propose/SKILL.md`)) && fs.existsSync(inside(root, 'openspec/specs')) && fs.existsSync(inside(root, 'openspec/changes'));
  if (!initialized) {
    for (const relative of [skillRoot, tool === 'claude' ? '.claude/commands/opsx' : tool === 'codex' ? '.codex' : '.github/prompts']) {
      const dir = inside(root, relative);
      if (fs.existsSync(dir) && fs.readdirSync(dir).some(name => /openspec|opsx/i.test(name))) throw new Error('Integración OpenSpec parcial o anterior: revisar antes de regenerar instrucciones existentes.');
    }
  }
  const plan = { assistant, session, openspecVersion, initializeOpenSpec: !initialized, ...(detail ? { inventory: inventory(root) } : {}), memory: path.relative(root, local), ready: false };
  if (dryRun) return { ...plan, dryRun: true };
  try { execFileSync('git', ['-C', root, 'rev-parse', '--show-toplevel'], { stdio: 'pipe' }); }
  catch (error) {
    if (!String(error.stderr).includes('not a git repository')) throw error;
    execFileSync('git', ['-C', root, 'init'], { stdio: 'pipe' });
  }
  integrate(root);
  mapAssistants(root);
  // No crear memoria hasta comprobar exclusión real, incluso con negaciones anidadas.
  execFileSync('git', ['-C', root, 'check-ignore', '--quiet', '--', `${local}/checkpoint.json`], { stdio: 'pipe' });
  fs.mkdirSync(local, { recursive: true });
  if (!initialized) run(root, ['init', '--tools', tool, '--profile', 'core', '--no-animation', '--no-copilot-cloud']);
  else run(root, ['--version']); // También prepara el ejecutable si solo estaban versionadas las skills.
  return { ...plan, setupComplete: true, next: 'Cargar prompt repositorio y ejecutar validate-repo. No se requiere una feature. Después usar /feature para iniciar un cambio.' };
}
