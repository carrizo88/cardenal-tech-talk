# Cierre y continuidad
Entrada: resultados verificados, decisiones, dudas y próximos pasos.
- Mantener documentación vigente del producto en doc/public y dominio técnico, integración y dependencias en doc/tech. Los JSON de contexto/tablero están en .cardenal y las especificaciones en openspec. No dejar conocimiento del equipo solamente en user-memory.
- Actualizar tablero con evidencia real. Archivar el cambio con OpenSpec cuando corresponda a su flujo y autorización; no archivar trabajo incompleto.
- Consultar la sección de memoria de .cardenal/README.md. Guardar un borrador en user-memory/sessions/<sesion>/draft.json y ejecutar checkpoint. Conservar dudas y referencias vigentes sin secretos ni transcripciones. Si excede el límite, resumir explícitamente, sin truncar dudas.
- Para continuar en otra conversación, indicar resume con la sesión elegida: carga solo el último checkpoint y revalida fuentes. No afirmar compactación nativa ni ahorro medido.
- Antes del cierre, comprobar documentación pública y técnica de la feature y enlaces en índices. Dejar explícitos los pendientes y actualizar contexto del repositorio si cambió. No archivar un cambio como sustituto de esta actualización.
Salida al usuario: qué cambió, qué se verificó, limitaciones y próximo paso, de forma breve. No duplicar los artefactos completos.

En light y standard, done requiere check final humano explícito del usuario (team lead). QA automatizado es opcional por feature y no reemplaza ese check. Sin pedido de QA, el usuario realiza las pruebas manuales con los pasos entregados. No atribuir aprobación sin respuesta real; dejar review y guardar checkpoint mientras falte. isComplete de OpenSpec no acredita implementación, pruebas ni aprobación.
