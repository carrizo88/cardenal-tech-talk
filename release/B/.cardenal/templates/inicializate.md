---
name: inicializate
description: Instalar Cardenal/OpenSpec y relevar el repositorio, sin solicitar ni implementar una feature.
---

# Inicializar el repositorio

1. Identificar el directorio solicitado y el asistente; preguntar solo si no están claros. Usar sesión inicio salvo indicación del usuario. Leer AGENTS.md.
2. Si falta Cardenal en este checkout, informar la ubicación y pedir que se incorpore con A/B; no cambiar de rama, hacer merge, fast-forward, reset o traer commits por ejecutar este comando. Esas operaciones requieren un pedido explícito separado.
3. Ejecutar una vez `node .cardenal/cli.mjs inicializate . <asistente> <sesion>`. No repetir durante el mismo relevamiento si ya funcionó. No normalizar archivos manualmente ante conflictos: la CLI tolera CRLF/LF; otras diferencias requieren revisión.
4. Cargar solo `node .cardenal/cli.mjs prompt . repositorio`. Relevar producto y técnica actuales, no un cambio futuro. Conservar context.json y board.json de features existentes. Si se retoma memoria, cargar solo el último checkpoint de la sesión indicada.
5. Ejecutar `node .cardenal/cli.mjs validate-repo .`. No ejecutar validate de feature como requisito del onboarding. Una ficha de cambio vacía no bloquea la inicialización.
6. Completar documentación .md en doc/public (producto) y doc/tech (dominio técnico, integración y dependencies), con índices y fuentes según el prompt repositorio. Preguntar por bibliotecas custom o que requieran atención especial; no declarar terminado con esqueletos vacíos. Guardar los JSON de control en .cardenal, nunca en doc.
7. Guardar checkpoint según la sección de memoria de .cardenal/README.md y cerrar con mapa del repositorio, dudas reales y el siguiente comando: `/feature <necesidad>`.

No pedir una feature, asignar roles, crear tareas de implementación, exigir un entorno para probar un cambio inexistente ni preguntar sobre promoción de ramas. Sí preguntar contradicciones o datos de producto/técnica necesarios para comprender el repositorio. No ejecutar migraciones ni escrituras en servicios para relevarlo. No afirmar certeza a partir de hipótesis.

Trabajar en la rama y checkout actuales. No crear ramas ni worktrees, cambiar de rama, hacer merge ni abrir PR automáticamente por cada feature. Solo hacerlo si el usuario lo solicita explícitamente. Si hay cambios previos que interfieren, explicar el conflicto y preguntar; no crear aislamiento por cuenta propia.
