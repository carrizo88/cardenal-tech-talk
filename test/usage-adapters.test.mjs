import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { mapAssistants } from '../src/adapters.mjs';
import { readCodexUsage } from '../src/usage.mjs';
import { integrate } from '../src/core.mjs';
import { spawnSync } from 'node:child_process';

function fixture(t) { const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cardenal-adapters-')); t.after(() => fs.rmSync(root, { recursive: true, force: true })); return root; }
test('mapeo conserva instrucciones y es idempotente; conflicto no escribe otros archivos', t => {
  const root = fixture(t); fs.writeFileSync(path.join(root, 'AGENTS.md'), 'Regla existente\n');
  assert.equal(mapAssistants(root, { dryRun: true }).changed.length, 3);
  assert.equal(fs.existsSync(path.join(root, 'CLAUDE.md')), false);
  mapAssistants(root); assert.ok(fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8').startsWith('Regla existente\n'));
  assert.equal(mapAssistants(root).changed.length, 0);
  fs.writeFileSync(path.join(root, 'CLAUDE.md'), '<!-- cardenal:adapter:start --> cambiado');
  assert.throws(() => mapAssistants(root), /Bloque existente/);
});
test('uso lee acumulado del turno una sola vez y separa caché de entrada', t => {
  const root = fixture(t), file = path.join(root, 'usage.jsonl');
  const counters = { input_tokens: 100, cached_input_tokens: 70, cache_write_input_tokens: 0, output_tokens: 10, reasoning_output_tokens: 2, total_tokens: 110 };
  const rows = [{ type: 'turn_context', payload: { turn_id: 't1', model: 'gpt-6-astra' } },
    { type: 'token_usage_record', timestamp: '2026-09-24T00:00:00Z', payload: { turn_id: 't1', turn_token_usage: counters } },
    { type: 'token_usage_record', timestamp: '2026-09-24T00:00:01Z', payload: { turn_id: 't1', turn_token_usage: counters } }];
  fs.writeFileSync(file, rows.map(r => JSON.stringify(r)).join('\n') + '\n{"partial":');
  assert.equal(readCodexUsage(file).counters.total_tokens, 110);
  assert.equal(readCodexUsage(file).counters.cached_input_tokens, 70);
  assert.throws(() => readCodexUsage(file, 'other'), /No hay/);
  rows[1].payload.turn_token_usage = { input_tokens: 100 };
  fs.writeFileSync(file, rows.map(r => JSON.stringify(r)).join('\n'));
  assert.throws(() => readCodexUsage(file), /incompletos/);
});

test('cierre exige final, contadores y task_complete del mismo turno y en orden', t => {
  const root = fixture(t), file = path.join(root, 'closure.jsonl');
  const counters = { input_tokens: 100, cached_input_tokens: 70, cache_write_input_tokens: 0, output_tokens: 10, reasoning_output_tokens: 2, total_tokens: 110 };
  const rows = [
    { type: 'turn_context', payload: { turn_id: 't1', model: 'test' } },
    { type: 'response_item', timestamp: '2026-09-27T00:00:01Z', payload: { role: 'assistant', phase: 'final_answer' } },
    { type: 'token_usage_record', timestamp: '2026-09-27T00:00:02Z', payload: { turn_id: 't1', turn_token_usage: counters } },
    { type: 'event_msg', timestamp: '2026-09-27T00:00:03Z', payload: { type: 'task_complete', turn_id: 't1' } }
  ];
  const save = () => fs.writeFileSync(file, rows.map(r => JSON.stringify(r)).join('\n'));
  save(); assert.equal(readCodexUsage(file, 't1').closed, true);
  rows[3].payload.turn_id = 't2'; save(); assert.equal(readCodexUsage(file, 't1').closed, false);
  rows[3].payload.turn_id = 't1'; rows[1].timestamp = '2026-09-27T00:00:04Z'; save(); assert.equal(readCodexUsage(file, 't1').closed, false);
  rows[1].timestamp = '2026-09-27T00:00:01Z';
  rows.push({ type: 'turn_context', payload: { turn_id: 't2', model: 'other' } }, { type: 'response_item', timestamp: '2026-09-27T00:00:04Z', payload: { role: 'assistant', phase: 'final_answer' } });
  save(); assert.equal(readCodexUsage(file, 't1').closed, true);
});

test('fallo de ejecución Git no se presenta como memoria o métricas sin ignorar', t => {
  const root = fixture(t); integrate(root);
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => key.toLowerCase() !== 'path'));
  env.PATH = path.join(root, 'no-executables');
  for (const args of [['resume', root, 'inicio'], ['usage-start', root, 'ensayo', 'unused.jsonl']]) {
    const result = spawnSync(process.execPath, [path.join(root, '.cardenal/cli.mjs'), ...args], { encoding: 'utf8', env });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /No se pudo ejecutar Git \(ENOENT\)/);
  }
});
