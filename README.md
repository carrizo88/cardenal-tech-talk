# Cardenal

Personalización de OpenSpec para relevar un repositorio, implementar cambios con SDD y mantener contexto para el equipo. Código fuente y distribuciones A/B en un único repositorio. Versión inicial de este paquete: 0.7.0.

## Contenido

- `src/`: CLI, integración, contexto, memoria, tablero y medición.
- `templates/`: instrucciones, prompts por etapa, esquema OpenSpec y ficha del MVP.
- `test/`: pruebas automatizadas del framework.
- `scripts/`: generadores de las distribuciones.
- `doc/`: guías de uso del framework.
- `distribution/`: fuentes de los README, changelog y verificadores específicos del release.
- `release/A/`: distribución para instalar por comando desde otra carpeta.
- `release/B/`: distribución para copiar a la raíz de un proyecto.

Este repositorio no contiene aplicaciones de ejemplo, credenciales, memorias personales ni el historial Git de otra distribución. No se ha definido licencia: acordarla antes de ofrecer condiciones de uso público.

## Desarrollar y generar releases

Requisitos: Node.js 22 o superior, npm y Git. El framework no requiere instalar dependencias npm para sus pruebas. La instalación inicial de OpenSpec en un proyecto necesita red.

Desde esta carpeta:

```powershell
npm test
npm run release:build
npm run release:verify
node release/A/scripts/verify-release.mjs
```

Modificar `src`, `templates`, `test`, `doc` y `distribution`, no los archivos generados dentro de `release`. `release:build` reconstruye A y B en staging antes de reemplazar el release generado y recalcula los manifiestos SHA-256. Se detiene si encuentra enlaces o un Git propio en el destino. No instala OpenSpec en un proyecto real ni hace commit o push.

Al cambiar versión, actualizar package.json, los títulos pertinentes en distribution y distribution/A/CHANGELOG.md antes de generar. Conservar coherencia con la versión anunciada por la CLI. Revisar el diff y las notas de migración cuando cambien formatos.

## Usar A: instalación por comando

Elegir A para incorporar Cardenal desde otra carpeta conservando instrucciones existentes. El proyecto destino debe existir.

```powershell
cd release/A
node src/cli.mjs inicializate D:/proyectos/mi-proyecto claude
```

El comando prepara archivos e instala/inicializa OpenSpec si falta. No ejecuta un modelo ni entrevista al usuario. Abrir después el proyecto en el asistente y ejecutar:

```text
/inicializate
```

El asistente releva y completa documentación. Para trabajar un cambio:

```text
/feature Describir la necesidad y el resultado esperado
```

Conflictos con instrucciones o runtimes previos requieren migración explícita; no sobrescribir datos del proyecto. Ver [guía A](release/A/README.md).

## Usar B: copiar archivos

Copiar **el contenido de release/B**, incluidas carpetas ocultas, a la raíz del proyecto. No copiar A ni toda la carpeta release. B entrega instrucciones completas y puede reemplazar AGENTS.md, CLAUDE.md y las instrucciones de Copilot: revisar esos reemplazos; elegir A para preservar instrucciones anteriores.

Abrir o recargar el proyecto en Claude y usar `/inicializate`; el asistente prepara OpenSpec y releva el repo. Luego `/feature <necesidad>`. No se necesita un prompt largo. Si la interfaz no muestra la skill, pedir que siga `.cardenal/templates/inicializate.md` o `.cardenal/templates/feature.md`.

B no distribuye JSON vacíos del proyecto ni documentación de negocio que sobrescriba la existente. Ver [guía B](release/B/CARDENAL.md).

## Qué se comparte y cómo se trabaja

Versionar `.cardenal`, instrucciones y skills de integración, `openspec`, `doc/public` y `doc/tech`. Las sesiones en `user-memory` y `doc/private` quedan locales e ignoradas, además de las exclusiones habituales de secretos y artefactos generados.

El usuario es team lead. Agentes analyst/front/back según necesidad; QA automatizado y navegador opcionales por pedido de cada feature. Conservar checks técnicos pertinentes y exigir check final humano. Trabajar en la rama actual, sin ramas ni PR automáticos.

La ficha para participantes está en [templates/ficha-mvp-del-equipo.md](templates/ficha-mvp-del-equipo.md) y se incorpora al proyecto bajo `.cardenal/templates/`.

## Prompt para actualizar los releases

Abrir una conversación sobre este repositorio y pegar:

```text
Trabajá en este repositorio de Cardenal y en su rama actual.

Revisá los cambios del framework y sincronizá los releases A y B a partir de sus fuentes: src/, templates/, test/, doc/ y distribution/. No uses otro checkout ni copies laboratorios, secretos, memorias o datos de proyectos.

Realizá los ajustes necesarios en las fuentes; evitá editar manualmente release/. Conservá el contexto y las instrucciones propias de los proyectos consumidores. Si cambian formatos, explicá la migración y agregá pruebas significativas. Mantené coherentes la versión del paquete, la CLI, la documentación de distribución y el changelog; no inventes resultados ni compatibilidad.

Ejecutá npm test, npm run release:build y npm run release:verify. Verificá también release/A/scripts/verify-release.mjs y que A funcione desde otra carpeta y B incluya archivos ocultos y la ficha, sin JSON de estado ni documentos vacíos de negocio que sobrescriban un proyecto. Revisá el diff final y comprobá que no se hayan agregado datos privados.

Entregá un resumen de los cambios, pruebas y límites. No crees ramas, commits, PR ni hagas push salvo pedido explícito. Si hay un conflicto real que pueda perder datos, explicalo antes de resolverlo.
```
