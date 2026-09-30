# Plantillas y contexto por etapa

Cardenal 0.4 separa instrucciones de trabajo y documentos SDD. Ambos son compartidos y versionados; user-memory sigue siendo continuidad local.

## Prompts internos

En el proyecto instalado viven en `.cardenal/prompts/`: relevamiento, seleccion-roles, implementacion, verificacion y cierre. La skill inicializate elige la etapa pendiente, lee solo su prompt y evita repetir preparación o información confirmada.

```powershell
node .cardenal/cli.mjs prompt . relevamiento
```

El comando solo muestra las instrucciones de esa etapa: no ejecuta agentes ni decide automáticamente si terminó. El asistente contrasta evidencia y dudas antes de continuar. No cargar los cinco prompts de una vez.

## Plantillas SDD

`openspec/schemas/cardenal/` contiene schema.yaml y templates/proposal.md, spec.md, design.md y tasks.md. La propuesta conecta problema, actor, valor y alcance; las specs fijan comportamiento; el diseño explica decisiones técnicas; las tareas incluyen verificación. Se enlazan fuentes y decisiones sin copiar toda la documentación en cada artefacto.

Una instalación nueva selecciona `schema: cardenal`. Si había config.yaml, se conserva su esquema. Para adoptar Cardenal en un cambio concreto de un proyecto existente, acordar la elección y ejecutar:

```powershell
node .cardenal/cli.mjs openspec . schema validate cardenal
node .cardenal/cli.mjs openspec . new change nombre-del-cambio --schema cardenal
```

Para personalizar, editar el prompt de la etapa o la plantilla pertinente. Mantener las estructuras de OpenSpec: Requirement, Scenario con cuatro signos #, operaciones de delta y checkboxes de tareas. Validar el esquema después de editarlo y un cambio representativo después de generar sus artefactos. Cardenal conserva archivos ajenos y rechaza diferencias al reinstalar; no sobrescribe personalizaciones. Las plantillas no fuerzan al modelo ni sustituyen pruebas del producto.

En la distribución, los originales están en templates/prompts y templates/schemas. La opción B incluye sus fuentes dentro de .cardenal/templates y el arranque crea el esquema en openspec, sin copiar documentos de negocio vacíos sobre los existentes.

## Salida breve y medición

inicializate omite el inventario por defecto y ni siquiera lo recorre salvo --detail. inspect devuelve conteo y truncamiento; init devuelve cantidad de archivos afectados; map-assistants muestra las rutas cambiadas. --detail conserva el acceso al informe completo. Los errores, preguntas y bloqueos de validación no se recortan; resume conserva todas las dudas del checkpoint. La salida nativa de OpenSpec se mantiene íntegra.

Esto reduce texto innecesario y lecturas repetidas; no demuestra por sí solo ahorro de tokens ni mejora de calidad. Para medirlo, comparar la misma tarea y estado inicial, modelo y criterio de aceptación; incluir llamadas, tokens por categoría, preparación, verificación y cierre. No convertir bytes en tokens ni comparar solo el tamaño de un prompt.

Comprobación realizada con OpenSpec 1.13.2: esquema válido, selección por defecto, carga de instrucciones de propuesta y validación estricta de un cambio sintético. Esto no es una prueba de comportamiento de una feature ni del recorrido conversacional en todos los asistentes.

## Separación 0.5.0

Se agrega el prompt repositorio para /inicializate. Los cinco prompts de cambio se utilizan con /feature. repository-context.json y validate-repo no requieren una feature; context.json y validate continúan validando cada cambio. Ambas skills conservan rama y checkout actuales: no crear ramas, worktrees ni PR por iniciativa propia.
