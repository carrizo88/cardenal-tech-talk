# Notas de versión

## 0.7.0

- Contexto y tablero JSON encapsulados en .cardenal; migración de registros legacy sin sobrescribir destinos diferentes.
- Documentación Markdown en doc/public y doc/tech, índices y dependencies; doc/private sigue local e ignorado para información confidencial.
- Inicialización releva funcionalidades y consulta librerías especiales; lectura selectiva de paquetes, sin inventar APIs.
- Feature, verificación y cierre mantienen documentación vigente en ambas audiencias, además de OpenSpec.
- Adaptadores recuperan índices al comenzar conversaciones; B no distribuye JSON de estado ni sobrescribe documentación de proyecto.
- 39 pruebas automatizadas.

## 0.6.0

- Usuario como team lead; roles de agente lead e infra retirados.
- QA manual por defecto. Testing automatizado requiere pedido por feature y elección explícita de navegador.
- Checks técnicos pertinentes se mantienen. Todo done requiere check humano real, incluso tras QA.
- Tableros activos legacy deben migrarse según templates/team.md; no se modifican históricos ni se fabrican aprobaciones.
- Plantillas, esquema OpenSpec y distribuciones A/B sincronizados. 37 pruebas aprobadas.

## 0.5.0

- /inicializate releva el repositorio sin exigir una feature; registro y validate-repo separados.
- /feature inicia el flujo SDD de un cambio con contexto previo.
- Rama y checkout actuales; sin ramas, worktrees, merges ni PR automáticos.
- Comparaciones toleran CRLF/LF sin reescribir archivos; conflictos reales siguen protegidos.
- README A/B y guía de uso actualizados. 35 pruebas automatizadas.

## 0.4.1 — 27/09/2026

- Cierre por revisión humana real con identidad, referencia y evidencia, sin simular agentes.
- Métricas con cierre observado por turno; estado provisional cuando falta evidencia de finalización.
- Errores Git conservan su causa de ejecución en memoria y medición.
- Instrucciones distinguen planificación de implementación y respetan el alcance autorizado.
- 33 pruebas automatizadas aprobadas.

## 0.4.0 — 26/09/2026

- Cinco prompts internos por etapa y skill de entrada breve.
- Esquema nativo cardenal con cuatro plantillas SDD; configuración existente preservada.
- inicializate no recorre inventario salvo --detail; init, inspect y map-assistants tienen salida breve.
- 30 pruebas automatizadas; validación real de esquema y cambio sintético con OpenSpec 1.13.2.
- No se atribuye ahorro de tokens sin comparación equivalente.

## 0.3.0 — 25/09/2026

- Prompt de trabajo incorporado a la skill inicializate: no requiere pegarlo en el chat.
- Opción A por comando y opción B copiable a la raíz con reemplazo de agentes.
- OpenSpec se instala dentro del proyecto durante el mismo arranque.
- Memoria v2 en user-memory/sessions, sin perfiles de desarrollador, incompatible con el formato anterior.
- Dominio y decisiones siguen compartidos en doc/cardenal y openspec.
- 26 pruebas automatizadas y comprobación real de instalación local.

## 0.2.0 — 25/09/2026

- Comando inicializate y skill de relevamiento con preguntas y selección proporcional de roles.
- OpenSpec 1.13.2 mediante npm exec, sin instalación global; wrapper openspec.
- Preparación de Git y sesión local con comprobación de exclusión.
- 24 pruebas automatizadas e inicialización real en proyecto vacío.
- Resumen local explícito; compactación nativa automática pendiente.

## 0.1.0 — 25/09/2026

Primera distribución independiente para evaluación, sin dependencias npm.

- Integración conservadora, inventario y validación de contexto con fuentes.
- Checkpoints y recuperación privada por desarrollador/sesión.
- Seis contratos de rol, tablero y paquetes de tarea.
- Flujo ligero y bloqueo por dudas en la selección de roles.
- Mapeo de instrucciones para Codex/Astra, Claude y Copilot.
- Lectura de contadores reales del registro local Codex.
- 21 pruebas deterministas incluidas; validación real del asistente y ahorro no garantizados.

Sin proyectos de ejemplo, credenciales, transcripciones, sesiones ni métricas personales. Piloto técnico; no representa todavía la edición final para participantes del curso.
