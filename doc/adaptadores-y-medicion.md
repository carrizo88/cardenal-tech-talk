# Adaptadores y medición de Cardenal

## Modelo y ejecutor son dimensiones distintas

El perfil `astra` corresponde en esta prueba al modelo observado `gpt-6-astra`, ejecutado en Codex Desktop. Claude y Copilot también necesitan identificar ejecutor, versión y modelo antes de comparar resultados. Un archivo de instrucciones no selecciona un modelo ni crea agentes.

`map-assistants <repo> [--dry-run]` agrega bloques identificados conservando el contenido existente. Conflictos en bloques propios requieren revisión; no se reemplazan silenciosamente.

| Perfil | Entrada | Comportamiento |
| --- | --- | --- |
| Astra/Codex | AGENTS.md | Reglas compartidas y referencias de Cardenal |
| Claude Code/Desktop Code | CLAUDE.md con @AGENTS.md | Puente compatible, incluso sin lectura nativa de AGENTS.md |
| Copilot | .github/copilot-instructions.md | Referencia a AGENTS.md; lectura nativa y soporte varían por función/cliente |

Las reglas comunes viven en un bloque de AGENTS.md; contexto de negocio, tablero y memoria se cargan cuando corresponden. No se duplican sesiones en archivos siempre presentes.

Referencias de los proveedores para comprobar el soporte en la versión del cliente utilizada:

- [Codex: AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md): descubrimiento jerárquico y overrides.
- [Claude: memoria](https://code.claude.com/docs/en/memory): Cardenal genera CLAUDE.md con @AGENTS.md como puente. Comprobar el descubrimiento de instrucciones en el cliente y versión utilizados; el paquete no certifica soporte nativo de AGENTS.md en todas las versiones.
- [Copilot CLI: instrucciones](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-custom-instructions): admite AGENTS.md y archivos propios. Esto no demuestra compatibilidad idéntica de todos los clientes Copilot.

No se actualizaron asistentes ni settings globales. El descubrimiento en Claude/Copilot aún requiere ensayo en sus instalaciones reales.

## Contadores reales

```text
node src/cli.mjs usage-start <repo> <run-id> <registro-codex.jsonl>
node src/cli.mjs usage-report <repo> <run-id>
```

El adaptador `codex-local-v1` observa `turn_context` y `token_usage_record.turn_token_usage` de la sesión local autorizada. Guarda solo la referencia privada y los contadores, no copia mensajes, herramientas ni credenciales. Exige datos completos; no sustituye valores faltantes por cero. La ruta y la marca inicial quedan en `user-memory/metrics/`, ignorada por Git.

El informe muestra total acumulado del turno y diferencia desde la marca. No suma acumulados repetidos. Entrada incluye caché; salida incluye razonamiento. Esas subcategorías no se suman otra vez. El formato de sesión es interno y puede cambiar: si desaparece se rechaza la lectura en vez de inventar consumo. El [modo no interactivo de Codex](https://learn.chatgpt.com/docs/non-interactive-mode) documenta otra fuente de uso en turn.completed, todavía no importada por este adaptador.

La captura durante una ejecución no incluye su respuesta final ni eventos aún no persistidos. Para el cierre definitivo ejecutar usage-report después de terminar el turno. Repetir el reporte desde otra sesión conserva el turn ID medido.

No se calculan dólares a partir de cuotas de suscripción. Tampoco se presenta una reducción causal: comparar asistentes requiere mismo snapshot, requerimiento, pruebas y criterio de aceptación, con sesiones nuevas y registro separado de herramientas/modelos/caché. Este primer ensayo incluye desarrollo de la instrumentación y el mapeo, por lo que no sirve como comparación justa con una segunda ejecución ya preparada.

Claude y Copilot tienen mapeo de instrucciones; sus importadores de consumo aún están pendientes de observar los contadores que exponga cada ejecutor. No se afirma que una cuota, caracteres o bytes sean tokens reales.

## Corrección 0.4.1

usage-report acredita cierre solo con respuesta final, últimos contadores y task_complete del mismo turno en ese orden. status es closed-observed-counters o provisional; includesFinalResponse es true cuando se acredita esa secuencia y null si no está demostrada. No equivale a facturación. Errores de ejecución de Git conservan el código (por ejemplo EPERM), separados de problemas de exclusión.
