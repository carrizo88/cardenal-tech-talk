# Implementación
Entrada: cambio solicitado, ficha, tarjeta asignada y artefactos OpenSpec pertinentes.
- Resolver dudas que alteren comportamiento antes de implementar esa parte. No inventar una feature si solo se pidió inicializar.
- Antes de modificar código, preparar propuesta, specs, diseño y tareas mediante el esquema activo. En proyectos nuevos es cardenal; conservar el esquema existente. Si se desea cambiarlo, acordarlo explícitamente.
- Usar node .cardenal/cli.mjs openspec . <argumentos> para status e instructions del artefacto actual. Cargar únicamente sus dependencias. No leer todos los prompts ni copiar reglas entre documentos.
- Referenciar IDs de decisiones y escenarios. Mantener el formato nativo de OpenSpec. No marcar tareas terminadas antes de verificarlas.
- Implementar el alcance acordado; ante hallazgos que lo cambien, registrar la duda y preguntar. Preservar cambios ajenos.
- Consultar índices doc/public y doc/tech, cargar solo fichas pertinentes y referencias de doc/tech/dependencies. Actualizar ambas perspectivas con la feature implementada; no dejar el conocimiento vigente solo en openspec/changes. No sobrescribir documentación ajena ni convertir planes en capacidades existentes.
Salida: cambio y tareas actualizados, evidencia disponible y pendientes reales.
Siguiente: verificacion.

La finalización de propose o isComplete de status acredita artefactos de planificación, no código probado. Si el usuario autorizó implementar el cambio, continuar a apply después de planificar y resolver bloqueos; no pedir de nuevo la misma autorización solo porque termine una skill. Si pidió únicamente planificar, detenerse allí. No modificar instrucciones generadas de OpenSpec para ocultar diferencias.

Trabajar en la rama y checkout actuales. No crear ramas ni worktrees, cambiar de rama, hacer merge ni abrir PR automáticamente por cada feature. Solo hacerlo si el usuario lo solicita explícitamente. Si hay cambios previos que interfieren, explicar el conflicto y preguntar; no crear aislamiento por cuenta propia.
