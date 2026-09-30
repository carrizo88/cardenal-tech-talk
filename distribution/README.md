# Cardenal 0.7.0 — distribuciones

Las dos opciones son independientes. Elegir una; no copiar toda esta carpeta al proyecto.

| Opción | Uso | Instrucciones |
| --- | --- | --- |
| A | Ejecutar el instalador desde una carpeta externa. Conserva instrucciones ajenas. | [Guía A](A/README.md) |
| B | Copiar el contenido de B, incluidas carpetas ocultas, a la raíz del proyecto. Reemplaza las instrucciones de agentes. | [Guía B](B/CARDENAL.md) |

## A: instalar por comando

Desde la carpeta A:

```powershell
node src/cli.mjs inicializate D:/proyectos/mi-proyecto claude
```

Luego abrir el proyecto en el asistente y usar `/inicializate` para relevarlo.

## B: copiar archivos

Copiar **solo el contenido de B** a la raíz del proyecto, incluidas carpetas ocultas. Leer `CARDENAL.md` antes de aceptar reemplazos. Abrir el proyecto y usar `/inicializate`; el asistente instala OpenSpec si falta y releva el repositorio.

En ambas opciones, `/feature <necesidad>` inicia un cambio. Se trabaja sobre la rama actual y no se crean ramas ni PR automáticamente. El relevamiento registra comportamientos respaldados por las fuentes sin pedir reconfirmaciones especulativas. La memoria en `user-memory/` es local e ignorada por Git.

Para verificar la distribución completa, desde esta carpeta:

```powershell
node verify-release.mjs
```

Esta carpeta es una salida generada; las fuentes y el repositorio Git se gestionan desde la raíz de Cardenal. A y B pueden entregarse por separado. No se ha definido una licencia de distribución.

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
