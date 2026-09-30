# Equipo Cardenal

El **usuario es el team lead**: define prioridades, resuelve decisiones y da el check final. No se crean agentes lead ni infraestructura. Seleccionar solo las capacidades necesarias para cada feature, sin lanzar un equipo completo por defecto.

| Rol de agente | Responsabilidad | Entrega |
| --- | --- | --- |
| analyst | Necesidad, reglas, alcance y escenarios; consulta dudas al usuario | Criterios y decisiones con fuentes |
| front | Interacción, estados, accesibilidad y consumo de contratos | Código y verificaciones pertinentes |
| back | API, permisos, persistencia y contratos | Código y verificaciones pertinentes |
| testing | QA automatizado opcional, solicitado por el usuario para esta feature | Suite acotada y resultados reales; navegador solo si se solicita |

Las necesidades de operación se comunican al usuario y se asignan dentro del alcance autorizado, sin crear un rol infra. Elegir un rol no acredita ejecutar un agente. Si hay dudas de asignación, consultar antes del trabajo dependiente.

## Verificación por feature

Por defecto, QA es manual: el usuario prueba el comportamiento y da el check final. El ejecutor conserva los checks técnicos relevantes (compilación, pruebas existentes y regresiones necesarias); no lanza un agente QA, una nueva suite de punta a punta ni un navegador por defecto. Entregar al usuario pasos concretos, resultado esperado y límites de lo verificado. Mantener review hasta recibir su respuesta explícita.

Si el usuario pide QA automatizado para la feature, seleccionar testing, acordar el alcance de la suite y registrar la referencia a ese pedido. El agente ejecuta la suite y reporta comandos, entorno y resultados. Si también se pide navegador, registrar browser: true y usar un agente con esa capacidad para los escenarios acordados. Si no está disponible, informar la limitación y dejar la prueba pendiente o transferirla al usuario: nunca inventar una navegación. QA no sustituye el check final humano.

La elección no se hereda de otra feature. Si no hay pedido, usar manual sin preguntar por rutina; proponer automatización solo cuando haya una razón concreta y esperar la decisión antes de activarla.

## Tablero

`.cardenal/board.json` conserva schemaVersion 1. El workflow selecciona modo light para cambios localizados y standard para cambios transversales. Todas las tarjetas deben pertenecer a roles seleccionados. questions registra solo dudas reales de selección.

```json
"workflow": {
  "mode": "light",
  "roles": ["front"],
  "reason": "Ajuste localizado de interfaz",
  "questions": [],
  "qa": { "mode": "manual" }
}
```

Omitir qa equivale a manual. Para automatización solicitada, agregar testing a roles y usar:

```json
"qa": {
  "mode": "automated",
  "requestReference": "Referencia auténtica al pedido del usuario para esta feature",
  "browser": true
}
```

browser: false habilita suite sin pruebas con agente de navegador. Estos campos registran intención; no ejecutan ni autentican agentes.

En standard, `agreements.analyst` referencia el alcance y los criterios revisados con path y sha256. El plan técnico puede estar en el mismo documento, sin un acuerdo separado de lead. En light no se exige un acuerdo adicional. No generar artefactos duplicados para representar agentes que no participaron.

Estados: backlog → ready → active → review → done. Un bloqueo real lleva a blocked. Las dependencias deben estar done antes de avanzar. Serializar tareas que comparten archivos; no crear ramas o worktrees por iniciativa propia. El asistente puede mantener el tablero, bajo las decisiones del usuario.

```json
{
  "id": "T1",
  "title": "Entrega concreta",
  "role": "front",
  "state": "backlog",
  "acceptance": "Resultado observable",
  "dependsOn": [],
  "files": ["src"],
  "questions": [],
  "evidence": [],
  "reviews": []
}
```

Evidence contiene referencias `{ "path": ".cardenal/resultado.md", "sha256": "hash real" }`. Entregar comportamiento, archivos, escenarios, resultados y dudas pendientes. No copiar secretos ni memorias locales a los documentos compartidos.

Una revisión real de otro agente puede registrarse con kind: agent, role distinto del ejecutor, verdict y evidence. Las revisiones testing necesitan autorización de QA en esta feature. Ninguna revisión de agente permite cerrar sin el check humano.

## Check final del usuario

```json
{"kind":"human","reviewer":"usuario que revisó","reference":"referencia a su check explícito","verdict":"approved","evidence":{"path":".cardenal/revision.md","sha256":"hash real"}}
```

No incluir role en la revisión humana. El informe debe registrar qué probó y aprobó el usuario, o qué limitaciones aceptó expresamente. No deducir aprobación del silencio ni del pedido de implementar. En light y standard, done requiere evidencia vigente, check humano aprobado y ninguna solicitud de cambios pendiente. El validador comprueba estructura y hashes; no autentica a la persona ni demuestra que una prueba se ejecutó.

```text
node .cardenal/cli.mjs board-check .
node .cardenal/cli.mjs task-package . T1
```

## Actualización desde el equipo anterior

No reescribir históricos ni memorias automáticamente. En un tablero activo, revisar tareas lead/infra con el usuario y reasignar las que sigan vigentes a analyst/front/back según su alcance. Eliminar agreements.lead solo después de conservar en el contexto las decisiones útiles, sin inventar un nuevo acuerdo humano. QA anterior no equivale a un pedido de QA para otra feature. Las entregas sin check humano permanecen review. Volver a ejecutar board-check tras migrar.
