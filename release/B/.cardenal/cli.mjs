#!/usr/bin/env node
import { integrate, inventory, validate, stagePrompt } from './core.mjs';
import { checkpoint, resume } from './memory.mjs';
import { validateBoard, taskPackage } from './team.mjs';
import { usageStart, usageReport } from './usage.mjs';
import { mapAssistants } from './adapters.mjs';
import { initialize, runOpenSpec } from './onboarding.mjs';

const [command, ...args] = process.argv.slice(2);
try {
  if (!command || command === '--help') {
    console.log('  inicializate <repo> [claude|astra|codex|copilot] [session] [--dry-run] [--detail]\n  validate-repo <repo>\n  feature <repo>\n  prompt <repo> <etapa>\n  openspec <repo> <argumentos...>\nInicializate prepara OpenSpec mediante npm (requiere red la primera vez).');
    console.log('  map-assistants <repo> [--dry-run] [--detail]\n  usage-start <repo> <run-id> <codex-session.jsonl>\n  usage-report <repo> <run-id>');
    console.log('Cardenal 0.7.0\n  init <repo> [--dry-run] [--detail]\n  inspect <repo> [--detail]\n  validate <repo>\n  checkpoint <repo> <session> <private-draft.json>\n  resume <repo> <session>\n  board-check <repo>\n  task-package <repo> <task-id>\nNo ejecuta un modelo. init conserva su comportamiento local; inicializate prepara OpenSpec. Node >=22.');
  } else if (command === 'inicializate') {
    const positional = args.filter(a => !['--dry-run', '--detail'].includes(a));
    if (positional.length < 1 || positional.length > 3 || positional.some(a => a.startsWith('--'))) throw new Error('Argumentos inválidos.');
    const [target, assistant, session] = positional;
    const result = initialize(target, { assistant, session, dryRun: args.includes('--dry-run'), detail: args.includes('--detail') });
    console.log(JSON.stringify(result, null, 2));
    if (result.questions) process.exitCode = 2;
  } else if (command === 'validate-repo') {
    if (args.length !== 1) throw new Error('Indicar repositorio.');
    const result = validate(args[0], { scope: 'repository' });
    console.log(JSON.stringify(result, null, 2));
    if (!result.ready) process.exitCode = result.valid ? 2 : 1;
  } else if (command === 'feature') {
    if (args.length !== 1) throw new Error('Indicar repositorio.');
    console.log(stagePrompt(args[0], 'relevamiento'));
  } else if (command === 'prompt') {
    if (args.length !== 2) throw new Error('Indicar repositorio y etapa.');
    console.log(stagePrompt(...args));
  } else if (command === 'openspec') {
    if (args.length < 2) throw new Error('Indicar repositorio y argumentos OpenSpec.');
    console.log(runOpenSpec(args[0], args.slice(1)));
  } else if (command === 'map-assistants') {
    if (args.length < 1 || args.length > 3 || args.slice(1).some(a => !['--dry-run', '--detail'].includes(a))) throw new Error('Argumentos inválidos.');
    const result = mapAssistants(args[0], { dryRun: args.includes('--dry-run') });
    console.log(JSON.stringify(args.includes('--detail') ? result : { dryRun: result.dryRun, changed: result.changed, note: 'Instrucciones preservadas. --detail muestra compatibilidad.' }, null, 2));
  } else if (['usage-start', 'usage-report'].includes(command)) {
    if (args.length !== (command === 'usage-start' ? 3 : 2)) throw new Error('Argumentos inválidos.');
    console.log(JSON.stringify(command === 'usage-start' ? usageStart(...args) : usageReport(...args), null, 2));
  } else if (['board-check', 'task-package'].includes(command)) {
    if (args.length !== (command === 'board-check' ? 1 : 2)) throw new Error('Argumentos inválidos. Consultar --help.');
    const result = command === 'board-check' ? validateBoard(args[0]) : taskPackage(...args);
    console.log(JSON.stringify(result, null, 2));
    if (command === 'board-check' && !result.valid) process.exitCode = 1;
  } else if (['checkpoint', 'resume'].includes(command)) {
    if (args.length !== (command === 'checkpoint' ? 3 : 2)) throw new Error('Argumentos inválidos. Consultar --help.');
    const result = command === 'checkpoint' ? checkpoint(...args) : resume(...args);
    console.log(JSON.stringify(result, null, 2));
    if (command === 'resume' && !result.ready) process.exitCode = 2;
  } else {
    if (!['init', 'inspect', 'validate'].includes(command)) throw new Error(`Comando desconocido: ${command}`);
    const paths = args.filter(a => !a.startsWith('--'));
    if (paths.length !== 1 || args.some(a => a.startsWith('--') && !((command === 'init' && a === '--dry-run') || (['init', 'inspect'].includes(command) && a === '--detail')))) throw new Error('Argumentos inválidos. Consultar --help.');
    const result = command === 'init' ? integrate(paths[0], { dryRun: args.includes('--dry-run') }) : command === 'inspect' ? inventory(paths[0]) : validate(paths[0]);
    const output = args.includes('--detail') || command === 'validate' ? result : command === 'init' ? { dryRun: result.dryRun, changedFiles: result.changes.length, note: 'Copia de bajo nivel. Usar inicializate para preparar OpenSpec; --detail para rutas.' } : { fileCount: result.files.length, truncated: result.truncated, note: 'Usar búsquedas dirigidas; --detail muestra las rutas.' };
    console.log(JSON.stringify(output, null, 2));
    if (command === 'validate' && !result.ready) process.exitCode = result.valid ? 2 : 1;
  }
} catch (error) { console.error(`Cardenal: ${error.message}`); process.exitCode = 1; }
