# Cardenal 0.7.0

Framework SDD con OpenSpec, relevamiento de repositorio, trabajo por feature y memoria local. Requiere Node 22+, npm y Git; red para instalar OpenSpec la primera vez. Piloto para evaluación acompañada.

## 1. Incorporar Cardenal

Esta es la distribución A, para instalar desde otra carpeta. Se trabaja sobre la rama y checkout actuales: no se crean ramas, worktrees o PR por cada feature, ni se cambia de rama o hace merge automáticamente. Estas acciones requieren un pedido explícito. Si el checkout no contiene Cardenal, incorporarlo allí; no traer otra rama por iniciativa del asistente.

### Opción A: distribución en otra carpeta

Desde esta distribución, apuntar al proyecto existente:

```powershell
node src/cli.mjs inicializate D:/proyectos/mi-proyecto claude
```

Este comando de terminal prepara archivos y OpenSpec; no entrevista al usuario ni ejecuta un modelo. La carpeta destino debe existir. Conserva instrucciones ajenas y configuración existente; diferencias reales con instalaciones anteriores requieren migración explícita. Luego abrir el proyecto en el asistente y seguir el paso 2.

## 2. Inicializar y relevar el repositorio

```text
/inicializate
```

No dar una feature. El asistente releva propósito, usuarios, capacidades, stack, arquitectura, datos, autenticación, ejecución y pruebas a partir del repositorio. Pregunta contradicciones o información necesaria para comprenderlo; no pide alcance de una feature ni decide dónde probar cambios inexistentes.

Guarda hechos, fuentes y dudas en .cardenal/repository-context.json y ejecuta validate-repo. No toca la ficha o tablero de un cambio anterior. El relevamiento puede quedar listo sin feature; una duda real del repositorio puede quedar bloqueante. Termina con un checkpoint y el siguiente comando.

## 3. Empezar una feature

```text
/feature Agregar filtros por materia y profesor
```

El asistente reutiliza el contexto del repositorio y pregunta solo lo que falte para esa necesidad. Continúa por relevamiento del cambio, roles, propuesta/specs/diseño/tareas, implementación y verificación según lo solicitado. Solo se escribe la necesidad: reutilizar contexto, detectar dudas del cambio, preservar reglas vigentes, seleccionar roles mínimos, usar plantillas, verificar y guardar checkpoint son responsabilidades internas de /feature. Mantiene la misma rama; no abre un PR por defecto.

La ficha de feature vive en .cardenal/context.json y las tareas en board.json. validate y board-check mantienen sus exigencias para implementar y cerrar. Una revisión humana debe ser real y explícita, sin inventar otro agente. Planificación completa no significa implementación aprobada.

## Otros asistentes y terminal

En Codex/Astra seleccionar las skills inicializate o feature; en Copilot depende de la interfaz. Si el comando slash no aparece, pedir «Seguí .cardenal/templates/inicializate.md» o «Seguí .cardenal/templates/feature.md para [necesidad]». Requiere acceso al proyecto y terminal.

```powershell
node .cardenal/cli.mjs validate-repo .
node .cardenal/cli.mjs feature .
node .cardenal/cli.mjs validate .
node .cardenal/cli.mjs board-check .
```

feature en terminal solo muestra el prompt de relevamiento, no ejecuta un modelo. inicializate, init, inspect y map-assistants ofrecen --detail cuando corresponda; se conserva completa la información de errores y bloqueos. init es la copia de bajo nivel, no el recorrido conversacional.

## OpenSpec, memoria y personalización

OpenSpec 1.13.2 se instala localmente en user-memory/tools/openspec. Usar el wrapper `node .cardenal/cli.mjs openspec . <argumentos>`. Los proyectos nuevos seleccionan el esquema cardenal; la configuración existente se conserva. No cambia dependencias de la aplicación ni instala herramientas globales.

user-memory/ queda ignorado por Git. Sesión inicio por defecto, sin perfiles de desarrollador. doc/public, doc/tech y openspec contienen el conocimiento compartido. La memoria v2 no importa perfiles antiguos ni compacta automáticamente el contexto interno del asistente.

```powershell
node .cardenal/cli.mjs checkpoint . inicio user-memory/sessions/inicio/draft.json
node .cardenal/cli.mjs resume . inicio
```

Ver [contrato de contexto y memoria](templates/context-guide.md), [plantillas](doc/plantillas-cardenal.md) y [medición](doc/adaptadores-y-medicion.md). Cargar solo el prompt de la etapa activa; no se garantiza ahorro de tokens.

## Windows y actualizaciones

CRLF y LF se consideran equivalentes al comparar archivos y bloques generados; no hace falta modificar core.autocrlf ni convertir los archivos manualmente. Las diferencias reales siguen bloqueando la sobrescritura. Para actualizar una instalación anterior, comparar y migrar explícitamente archivos de framework; conservar datos de negocio, memorias e instrucciones ajenas. 

## Verificación y publicación

```powershell
npm test
node scripts/verify-release.mjs
```

39 pruebas automatizadas, incluyendo onboarding sin feature y checkouts CRLF. Los validadores comprueban estructura y referencias, no veracidad ni autenticidad de revisiones. Falta validar este nuevo recorrido conversacional en cada cliente.

Esta carpeta A es una distribución independiente. No incluye laboratorios, memorias o secretos. No se asignó licencia de distribución: definirla antes de ofrecer uso público. [Notas de versión](CHANGELOG.md).

## Equipo y check final

El usuario es el team lead. Seleccionar analyst/front/back según necesidad; no hay agentes lead ni infraestructura. QA automatizado con suite y agente de navegador es opcional, por pedido para cada feature. Por defecto el usuario hace las pruebas manuales con pasos proporcionados por el ejecutor; los checks técnicos pertinentes se conservan. Todo cierre requiere el check humano explícito, incluso con QA. Tableros anteriores con lead/infra deben migrarse siguiendo templates/team.md (en la opción B: .cardenal/templates/team.md); no reinterpretar revisiones históricas como aprobaciones del usuario.

## Contexto disponible en cada conversación

Los JSON de control viven en .cardenal (repository-context.json, context.json y board.json). /inicializate completa Markdown de producto en doc/public y documentación técnica en doc/tech, con índices y fichas breves de dependencies. Pregunta por librerías propias o de consideración especial; consulta node_modules solo de forma dirigida. doc/private sigue ignorado por Git para información confidencial, incluidas fichas de librerías del cliente cuando corresponda; nunca credenciales.

/feature reutiliza los índices y actualiza la documentación vigente de ambas audiencias junto con el código. Los artefactos openspec/changes conservan el trabajo del cambio, pero no reemplazan las fichas del sistema. La CLI prepara los esqueletos; el asistente completa el relevamiento, no el instalador por sí solo.

Para instalaciones anteriores, revisar y actualizar el runtime y las instrucciones antes de inicializar. La integración mueve los tres JSON legacy desde doc/cardenal a .cardenal cuando no hay conflictos; conserva datos y rechaza destinos diferentes. Revisar referencias/hashes afectados y reorganizar Markdown histórico con trazabilidad. No reemplazar registros propios con archivos vacíos.

## Archivos compartidos por Git

.cardenal se versiona completo como parte del proyecto: runtime, plantillas y JSON de contexto/tablero. También se versionan las instrucciones y skills de integración (AGENTS.md, CLAUDE.md, .github, .claude/skills y .agents/skills según corresponda), openspec, doc/public y doc/tech. Que una carpeta empiece con punto no significa que sea privada.

El estado de sesión del usuario en user-memory y doc/private quedan ignorados, al igual que la ruta legacy de sesiones .local/sdd. Esto no elimina exclusiones habituales de credenciales, node_modules o builds ni implica versionar caches o worktrees del asistente.

La ficha para participantes está en .cardenal/templates/ficha-mvp-del-equipo.md tras incorporar Cardenal. Completar una copia como acuerdo del equipo, sin datos confidenciales.
