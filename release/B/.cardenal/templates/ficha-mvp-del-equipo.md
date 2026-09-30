# Tu primer MVP de personalización de OpenSpec

Ficha para completar durante la charla y acordar después con el equipo. Empezá por una dificultad concreta y una feature pequeña. No hace falta copiar todas las piezas de Cardenal.

| Pregunta | Tu respuesta |
| --- | --- |
| ¿Qué dificultad se repite hoy en el equipo? | |
| ¿A quién afecta y qué ejemplo reciente tenemos? | |
| ¿Qué única personalización probaríamos primero? | |
| ¿Con quién debemos acordarla? | |
| ¿Qué feature pequeña usaremos como piloto? | |
| ¿Cómo sabremos si sirvió? | |
| ¿Cuándo revisaremos el resultado juntos? | |

## Cuatro acuerdos antes del piloto

- **Decisiones:** quién resuelve dudas de producto y alcance. En el caso Cardenal, el usuario es team lead.
- **Documentación:** dónde quedan las funcionalidades públicas, los contratos técnicos y la información confidencial. Otra persona debe poder encontrar el contexto sin leer el chat privado.
- **Verificación:** checks técnicos pertinentes y pasos de prueba manual; QA automatizado y navegador solo si se necesitan y se solicitan.
- **Cierre:** quién prueba y da el check final. No confundir un documento completo con una implementación aprobada.

## Ejemplo ilustrativo

Dificultad: al retomar un cambio, se vuelve a preguntar por reglas ya acordadas.

Primer MVP: una ficha de reglas con fuentes y una instrucción para consultarla antes de preguntar. No sumar más agentes todavía.

Acuerdo: producto confirma la regla; desarrollo mantiene la ficha cuando cambia el comportamiento; el usuario revisa el resultado.

Piloto: un cambio pequeño en una funcionalidad existente.

Señal de utilidad: un compañero puede explicar la regla y continuar el cambio usando la documentación del repo. Registrar dudas o correcciones que aparezcan. El ejemplo no acredita una mejora medida ni ahorro de tokens.

## Decisión después de probar

Conservar lo útil, simplificar lo que genere trabajo sin beneficio y anotar qué falta comprobar. El siguiente incremento se decide a partir del uso, no de la cantidad de herramientas disponibles.

## Qué comparte el equipo

Versionar .cardenal, las instrucciones y skills de los asistentes, openspec, doc/public y doc/tech. Las sesiones/checkpoints de user-memory y doc/private quedan locales e ignorados. Mantener además las exclusiones habituales de secretos, dependencias instaladas y builds.
