# Contexto de Cardenal

`context.json` es un registro compartible del cambio activo. No guardar secretos, transcripciones privadas ni sesiones personales. No reemplaza las especificaciones de OpenSpec.

## Formato v1

- `sources`: IDs únicos globalmente. `kind: user`, `reference`: referencia explícita a una respuesta real; o `kind: file`, `reference`: ruta relativa con `/`, `sha256`: hash del contenido actual. No se admiten rutas privadas ni enlaces simbólicos.
- `facts`: `id`, `area` (`product`/`technical`), `statement`, `status` (`confirmed`/`observed`/`proposed`/`superseded`), `source` (ID). Confirmado requiere fuente de usuario; observado requiere archivo. Una propuesta puede carecer de fuente. Reemplazado incluye `replacedBy` con el ID vigente.
- `questions`: `id`, `question`, `blocking` (booleano para el cambio activo), `status` (`open`/`resolved`/`deferred`). Resolver requiere `resolution` apuntando a una decisión confirmada. Posponer una pregunta bloqueante no desbloquea la tarea.
- `change`: `actor`, `problem`, `outcome`, `scope`, `acceptance`, `valueSignal` y `evidence` (IDs de hechos vigentes que sustentan esta ficha).

Para calcular un hash en PowerShell: `(Get-FileHash -LiteralPath 'ruta/al/archivo' -Algorithm SHA256).Hash.ToLowerInvariant()`. Volver a inspeccionar el archivo si cambió antes de actualizar su hash; no actualizarlo sólo para silenciar la validación.

## Uso

Para asignación y entregas, consultar [equipo y tablero](team.md). `board-check` valida el tablero compartido y `task-package` prepara una tarjeta ready/active con sus referencias; ninguno ejecuta agentes ni carga memoria ajena.

Invocar `/cardenal-relevar` en Claude Code o pedir que use esa skill. La disponibilidad en la pestaña Code de Desktop debe comprobarse en la instalación utilizada.

Desde la raíz: `node .cardenal/cli.mjs inspect .` y `node .cardenal/cli.mjs validate .`.

La CLI sólo inventaría rutas y verifica estructura, referencias y vigencia de archivos. No entrevista, decide ni llama a un modelo: la skill guía esa conversación. Una fuente de usuario se declara en el registro; la CLI no puede comprobar que la respuesta fue auténtica. Revisar semánticamente antes de pasar a OpenSpec.

`validate`: salida 0 = listo para revisión, 2 = registro válido pero incompleto/bloqueado, 1 = inválido/error. El JSON inicial es deliberadamente incompleto.

## Memoria local

La memoria local usa un identificador de sesión, inicio por defecto, sin perfiles de desarrollador (letras minúsculas, números, guion o guion bajo). En un repo Git con memoria ignorada, crear `user-memory/sessions/<session>/draft.json` con:

```json
{
  "objective": "Objetivo del cambio activo",
  "summary": "Resumen explícito del trabajo observado",
  "decisions": ["ID de decisión compartida y referencia; no inventar confirmaciones"],
  "questions": ["Dudas todavía abiertas"],
  "nextSteps": ["Próxima acción verificable"],
  "sources": [{"reference": "ruta/archivo", "sha256": "hash real del archivo inspeccionado"}]
}
```

El ejemplo es un esquema ilustrativo: reemplazar las referencias y calcular hashes reales. Las listas pueden estar vacías si no hay elementos que registrar.

```text
node .cardenal/cli.mjs checkpoint . <session> user-memory/sessions/<session>/draft.json
node .cardenal/cli.mjs resume . <session>
```

El checkpoint admite hasta 16000 bytes de payload: rechaza excesos sin truncar dudas. Resume carga solo el último y devuelve código 2 si hay fuentes obsoletas. Los anteriores permanecen en disco. La reducción es selección de contexto, no compactación automática del asistente ni un cálculo de tokens. Revisar decisiones y dudas contra el registro compartido, que sigue siendo la fuente durable del equipo.

La memoria se vincula al checkout por su ruta real; otro clon no la hereda. Los perfiles evitan mezclas accidentales, pero no son permisos de acceso: una máquina compartida requiere cuentas y permisos del sistema operativo. No guardar credenciales; no hay detección infalible de secretos en texto libre. No versionar ni sincronizar estas carpetas. Si un proceso se interrumpe dejando `writer.lock`, comprobar que no haya otro escritor antes de retirarlo manualmente.

La integración agrega la skill y herramientas en `.cardenal/`; no reemplaza `CLAUDE.md` o `AGENTS.md`. Si existía `openspec/config.yaml`, permanece intacto: incorporar contexto y reglas de Cardenal mediante un diff revisado, sin reemplazar el schema del equipo. Si no existía, se crea una configuración básica; el comando inicializate instala e inicializa OpenSpec en el mismo arranque. init solo copia los archivos.

El formato de memoria v2 no importa sesiones antiguas por desarrollador. La migración es deliberadamente incompatible: no copiar historiales automáticamente. Mantener las decisiones de negocio en doc/public, doc/tech y openspec, versionados.

## Repositorio y feature separados

/inicializate genera repository-context.json con schemaVersion, sources, facts y questions; no tiene change. validate-repo verifica este registro y admite producto observado con fuente, sin exigir decisiones de una feature. /feature usa ese contexto como base y registra su alcance en context.json y tareas en board.json. validate sigue siendo estricto para una feature: no se debilitó esa validación.

## Documentación vigente

Los JSON repository-context.json, context.json y board.json viven en .cardenal. doc contiene Markdown para personas: public para producto/stakeholders; tech para dominio técnico, integración y dependencies; private para información confidencial local. Los índices README.md permiten recuperar contexto selectivamente al comenzar una conversación. OpenSpec conserva specs e historia de cambios; cada feature actualiza también la documentación vigente en ambas audiencias. No copiar información confidencial de private a public ni a registros compartidos: referenciar archivos cuando corresponda.

Las librerías propias confidenciales del cliente se resumen en doc/private/dependencies; las compartibles en doc/tech/dependencies, con propósito, versión y uso observado. Preguntar por dependencias de consideración especial. node_modules solo se consulta de forma dirigida; no se incorpora al inventario ni se copia su contenido. Los resúmenes tienen referencias a los archivos consultados y se revalidan al cambiar versión.

Al actualizar desde versiones anteriores, mover los tres JSON de doc/cardenal a .cardenal sin perder hechos, tarjetas ni aprobaciones. Si existen ambos destinos con datos distintos, detener la migración y resolver el conflicto; nunca reemplazar por esqueletos. Actualizar referencias y hashes después de revisar las fuentes. Conservar documentos ajenos y evidencias históricas; reorganizarlos solo con trazabilidad. doc/private sigue ignorado por Git: no mover su contenido a tech ni public sin autorización.

### Público, técnico y confidencial

- doc/public: funcionalidades y reglas comprensibles para producto y stakeholders, en Markdown.
- doc/tech: funcionalidades técnicas, dominio, integración y dependencies compartibles, en Markdown versionado.
- doc/private: notas confidenciales locales y bibliotecas propietarias del cliente en dependencies/ cuando corresponda; ignorado por Git. No usar para credenciales ni datos personales reales. No inferir que una biblioteca es confidencial solo por ser custom: preguntar.

Leer primero los índices public/tech y después las fichas necesarias. Consultar private solo si el trabajo requiere esa información y mantener su contenido fuera de artefactos compartidos. La pregunta inicial sobre librerías especiales incluye si sus detalles son compartibles o confidenciales.

## Archivos compartidos por Git

.cardenal se versiona completo como parte del proyecto: runtime, plantillas y JSON de contexto/tablero. También se versionan las instrucciones y skills de integración (AGENTS.md, CLAUDE.md, .github, .claude/skills y .agents/skills según corresponda), openspec, doc/public y doc/tech. Que una carpeta empiece con punto no significa que sea privada.

El estado de sesión del usuario en user-memory y doc/private quedan ignorados, al igual que la ruta legacy de sesiones .local/sdd. Esto no elimina exclusiones habituales de credenciales, node_modules o builds ni implica versionar caches o worktrees del asistente.

La ficha para participantes está en .cardenal/templates/ficha-mvp-del-equipo.md tras incorporar Cardenal. Completar una copia como acuerdo del equipo, sin datos confidenciales.
