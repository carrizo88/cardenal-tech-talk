# Elegir un flujo proporcional al cambio

Usar el proceso mínimo que permita entender, implementar y verificar el cambio. Más documentos o roles no garantizan mejor calidad ni menor consumo de tokens.

Cambios implementados:

- Flujo light para ajustes localizados, sin acuerdos separados de analista y lead. Se conservan ficha, tarjeta, evidencia y condiciones de revisión.
- Selección explícita de roles. Si hay dudas sobre qué roles usar o delegar, preguntar al usuario y registrar workflow.questions. No preparar paquetes ni avanzar tarjetas con esas dudas abiertas.
- Lectura selectiva: consultar contratos de roles y memoria cuando corresponda; no releer todas las guías por paso.
- Referencias compartidas en vez de repetir reglas en múltiples documentos. Instalación y mapeo una sola vez por copia.

Tableros sin workflow mantienen el comportamiento anterior. El validador no evalúa semánticamente si light es apropiado: esa decisión debe justificarse en workflow.reason. Tampoco puede descubrir dudas no declaradas; esa responsabilidad está en la skill y el bloque AGENTS generado.

Evidencia: 21 pruebas de Cardenal aprobadas, incluida aceptación del flujo light sin acuerdos duplicados y rechazo de roles no seleccionados, dudas pendientes y cierre sin evidencia/revisión. Verificación estructural de la skill aprobada. No hubo ejecución de subagentes.

Para evaluar el flujo en un proyecto, comparar ejecuciones con el mismo punto de partida, requerimiento, modelo y criterios de aceptación. Separar preparación de implementación y cerrar la medición al terminar. Comparar calidad y consumo; no prometer ahorro antes de medir.
