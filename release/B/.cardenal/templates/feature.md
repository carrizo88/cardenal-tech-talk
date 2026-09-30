---
name: feature
description: Iniciar o retomar una feature con Cardenal, partiendo del contexto del repositorio y siguiendo SDD hasta verificación y revisión.
---

# Trabajar una feature

El usuario solo debe indicar `/feature <necesidad>`. Este flujo incorpora reutilización de contexto, preguntas pertinentes, plantillas SDD, roles mínimos, verificación y checkpoint; no pedir que el usuario repita estas instrucciones.

1. Usar la necesidad indicada junto al comando; si no se indicó, preguntar actor, problema y resultado esperado. Esta pregunta pertenece a feature, no a inicializate.
2. Leer los índices doc/public/README.md y doc/tech/README.md y abrir solo las fichas funcionales/técnicas y dependencias pertinentes. Consultar .cardenal/repository-context.json y revalidar solo las fuentes pertinentes. Si el repositorio no fue relevado, ejecutar primero inicializate. No cambiar de rama ni hacer merge sin un pedido explícito.
3. Cargar únicamente el prompt activo mediante `node .cardenal/cli.mjs prompt . <etapa>`: relevamiento, seleccion-roles, implementacion, verificacion, cierre. Retomar donde indique la evidencia, sin cargar todos a la vez.
4. Preservar contexto y tareas anteriores antes de preparar la ficha del nuevo cambio. Registrar actor, alcance, aceptación, decisiones y dudas en .cardenal/context.json. Consultar entorno de pruebas cuando el cambio lo requiera, especialmente si hay datos compartidos. No deducir aprobación ni simular revisores.
5. Usar validate y board-check para la feature, y OpenSpec para planificación e implementación según lo solicitado. isComplete de planificación no prueba código verificado. Si se autorizó implementar, continuar tras resolver bloqueos; si solo se pidió planificar, detenerse allí.
6. El usuario actúa como team lead; no crear agentes lead ni infra. QA manual del usuario por defecto. Activar QA automatizado y navegador solo si se solicitan para esta feature, registrando alcance y referencia al pedido; no heredar esa elección. Mantener checks técnicos pertinentes y esperar el check final humano para cerrar.
7. Actualizar en la misma feature doc/public y doc/tech con el comportamiento realmente implementado, sus límites y dependencias afectadas. Enlazar fichas desde sus índices; openspec/changes documenta el cambio pero no reemplaza la documentación vigente del sistema. Si falta implementación o verificación, marcarlo como pendiente.
8. Mantener las decisiones durables compartidas; checkpoint local en user-memory. Cerrar con evidencia y revisión real según los contratos de Cardenal.

Alternativa de terminal: `node .cardenal/cli.mjs feature .` muestra el prompt de relevamiento. No inicia un modelo ni ejecuta automáticamente la feature. En interfaces sin slash commands pedir que siga .cardenal/templates/feature.md.

Trabajar en la rama y checkout actuales. No crear ramas ni worktrees, cambiar de rama, hacer merge ni abrir PR automáticamente por cada feature. Solo hacerlo si el usuario lo solicita explícitamente. Si hay cambios previos que interfieren, explicar el conflicto y preguntar; no crear aislamiento por cuenta propia.
