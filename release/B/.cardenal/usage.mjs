import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { inside, rootPath } from './core.mjs';

const fields = ['input_tokens', 'cached_input_tokens', 'cache_write_input_tokens', 'output_tokens', 'reasoning_output_tokens', 'total_tokens'];
function counts(value) {
  if (!value || fields.some(k => !Number.isSafeInteger(value[k]) || value[k] < 0)) throw new Error('Contadores incompletos: no se sustituyen datos ausentes por cero.');
  if (value.cached_input_tokens > value.input_tokens || value.reasoning_output_tokens > value.output_tokens || value.total_tokens !== value.input_tokens + value.output_tokens) throw new Error('Contadores inconsistentes.');
  return Object.fromEntries(fields.map(k => [k, value[k]]));
}
export function readCodexUsage(source, turnId) {
  let activeTurn = turnId, observedTurn, model = null, latest = null;
  const finals = new Map(), completions = new Map();
  // Only metadata leaves this parser. Transcripts and tool bodies are never copied.
  const lines = fs.readFileSync(source, 'utf8').split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    let row;
    try { row = JSON.parse(lines[i]); } catch { if (i === lines.length - 1) continue; throw new Error('Registro de uso JSONL inválido.'); }
    if (row.type === 'turn_context') observedTurn = row.payload?.turn_id;
    if (row.type === 'response_item' && row.payload?.role === 'assistant' && row.payload?.phase === 'final_answer' && observedTurn) finals.set(observedTurn, row.timestamp);
    if (row.type === 'event_msg' && row.payload?.type === 'task_complete' && row.payload.turn_id) completions.set(row.payload.turn_id, row.timestamp);
    if (row.type === 'turn_context' && (!turnId || row.payload?.turn_id === turnId)) {
      if (activeTurn !== row.payload.turn_id) latest = null;
      activeTurn = row.payload.turn_id; model = row.payload.model;
    }
    if (row.type === 'token_usage_record' && row.payload?.turn_id === activeTurn) {
      latest = { turnId: activeTurn, model, timestamp: row.timestamp, counters: counts(row.payload.turn_token_usage) };
    }
  }
  if (!latest || !latest.turnId || !latest.model) throw new Error('No hay contadores reales compatibles para este turno.');
  const finalAnswerAt = finals.get(latest.turnId) ?? null;
  const completedAt = completions.get(latest.turnId) ?? null;
  const closed = Number.isFinite(Date.parse(finalAnswerAt)) && Number.isFinite(Date.parse(completedAt)) && Date.parse(finalAnswerAt) <= Date.parse(latest.timestamp) && Date.parse(latest.timestamp) <= Date.parse(completedAt);
  return { ...latest, finalAnswerAt, completedAt, closed };
}
function location(target, run) {
  const root = rootPath(target);
  if (!/^[a-z0-9][a-z0-9_-]{0,63}$/.test(run ?? '')) throw new Error('ID de medición inválido.');
  const relative = `user-memory/metrics/${run}.json`;
  try {
    const git = args => execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    if (git(['ls-files', '--', 'user-memory']).trim()) throw new Error();
    git(['check-ignore', '--no-index', '-q', relative]);
  } catch (error) {
    if (error.code) throw new Error(`No se pudo ejecutar Git (${error.code}); no se comprobó la exclusión de métricas.`, { cause: error });
    throw new Error('Las métricas deben estar ignoradas y no rastreadas por Git.', { cause: error });
  }
  return inside(root, relative);
}
export function usageStart(target, run, source) {
  const file = location(target, run);
  const baseline = readCodexUsage(source);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify({ schemaVersion: 1, adapter: 'codex-local-v1', source: fs.realpathSync(source), baseline }, null, 2), { flag: 'wx', mode: 0o600 });
  return { run, model: baseline.model, startedAt: baseline.timestamp, method: 'real-provider-counters', note: 'Total del turno incluye preparación; el tramo medido comienza en esta captura. No es facturación.' };
}
export function usageReport(target, run) {
  const record = JSON.parse(fs.readFileSync(location(target, run), 'utf8'));
  if (record.schemaVersion !== 1 || record.adapter !== 'codex-local-v1') throw new Error('Formato de medición no soportado.');
  const current = readCodexUsage(record.source, record.baseline.turnId);
  const baseline = counts(record.baseline.counters);
  const delta = Object.fromEntries(fields.map(k => [k, current.counters[k] - baseline[k]]));
  if (Object.values(delta).some(n => n < 0)) throw new Error('El contador retrocedió: no se puede calcular el consumo.');
  return { run, model: current.model, measurement: 'observed-not-estimated', from: record.baseline.timestamp, through: current.timestamp,
    measuredSegment: delta, wholeTurn: current.counters,
    uncachedInputInSegment: delta.input_tokens - delta.cached_input_tokens,
    money: null, turnId: current.turnId, status: current.closed ? 'closed-observed-counters' : 'provisional', includesFinalResponse: current.closed ? true : null,
    closure: { finalAnswerAt: current.finalAnswerAt, completedAt: current.completedAt, verified: current.closed },
    limitations: [current.closed ? 'Cierre observado: respuesta final → contadores → task_complete del mismo turno; no conciliación de facturación.' : 'Cierre no acreditado: falta la secuencia final → contadores → task_complete del mismo turno.', 'Entrada incluye caché; razonamiento es parte de salida. No sumar esas categorías dos veces.', 'No es una comparación causal de ahorro ni una factura. El formato local puede cambiar entre versiones de Codex.'] };
}
