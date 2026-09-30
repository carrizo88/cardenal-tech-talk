# Relevamiento
Entrada: necesidad de la feature, repository-context.json, ficha del cambio y fuentes pertinentes. Si solo se pidió inicializate, usar el prompt repositorio y no exigir una feature.
- Leer .cardenal/context.json; consultar su README solo para completar o corregir el formato.
- Precisar actor, problema, resultado, alcance, aceptación y señal de valor junto con restricciones técnicas observadas. Preguntar únicamente lo que falte; máximo tres preguntas prioritarias por ronda.
- Conservar las reglas vigentes respaldadas por fuentes, salvo cambio solicitado o contradicción concreta. Detectar qué decisiones introduce la nueva necesidad y cómo interactúa con lo existente; preguntar antes del trabajo dependiente si las fuentes no lo resuelven. No exigir que el usuario enumere esas dudas ni reconfirmar reglas ya claras.
- Separar hechos con fuente, decisiones confirmadas e hipótesis. No tomar el silencio como aprobación. Registrar contradicciones y dudas bloqueantes; avanzar solo en trabajo independiente.
- Buscar rutas concretas antes de leer archivos. No cargar inventarios completos, secretos o historiales. Releer una fuente solo si cambió o falta evidencia.
- Consultar índices doc/public y doc/tech, cargar solo fichas pertinentes y referencias de doc/tech/dependencies. Actualizar ambas perspectivas con la feature implementada; no dejar el conocimiento vigente solo en openspec/changes. No sobrescribir documentación ajena ni convertir planes en capacidades existentes.
Salida: ficha actualizada con referencias y dudas. Ejecutar validate; su éxito estructural no confirma veracidad. Si faltan datos, preguntar y no inventarlos para pasar la validación.
Siguiente: seleccion-roles cuando el alcance permita asignar trabajo.
