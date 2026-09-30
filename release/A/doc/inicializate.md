# Inicialización y features — Cardenal 0.7.0

/inicializate prepara OpenSpec y releva el repositorio sin pedir una feature. Registra producto, técnica, fuentes y dudas en repository-context.json. validate-repo comprueba ese registro sin campos change. No sobrescribe context.json ni board.json del trabajo anterior.

/feature <necesidad> reutiliza el relevamiento y comienza el flujo SDD de esa entrega: preguntas del cambio, roles, artefactos, implementación, pruebas y revisión según el alcance solicitado. validate sigue exigiendo una ficha de cambio completa.

Ambos usan la rama y checkout actuales. No crear ramas, worktrees ni PR ni cambiar de rama o hacer merge sin pedido explícito. La ausencia de Cardenal en una rama no autoriza traer otra: usar instalación A/B sobre el checkout solicitado.

La CLI inicializate prepara herramientas; la skill hace el relevamiento. La CLI feature muestra el prompt, no ejecuta un modelo. Las comparaciones de archivos y adaptadores toleran CRLF/LF sin reescribirlos, pero rechazan diferencias reales.

Pasos completos en el README.md de la raíz de esta distribución. En el repositorio fuente, las guías de las opciones están en release/A/README.md y release/B/CARDENAL.md. No se afirma compactación nativa ni ahorro de tokens.
