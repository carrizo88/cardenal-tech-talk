# Selección de roles
Entrada: alcance y dudas de la feature, tablero actual.
- El usuario es el team lead y da el check final; no asignar agentes lead ni infra. Consultar .cardenal/team.md solo al asignar trabajo.
- Elegir roles mínimos entre analyst, front y back; light para cambios localizados, standard para cambios transversales. Consultar dudas reales de roles antes de asignar y registrar workflow.questions.
- QA manual del usuario por defecto. Seleccionar testing solo ante pedido explícito de QA automatizado para esta feature: registrar workflow.qa con mode automated, requestReference y browser booleano. Una suite y un agente de navegador son opcionales; browser true requiere pedido del usuario. No heredar permisos de QA de otra feature ni preguntar por rutina si no hacen falta.
- El ejecutor mantiene checks técnicos pertinentes aunque QA sea manual. Roles declarados no equivalen a agentes ejecutados.
Salida: workflow, tarjetas y dependencias; acuerdo analyst en standard. Ejecutar board-check. No simular acuerdos ni revisiones.
Siguiente: implementación una vez resueltos los bloqueos y preparados los artefactos SDD.
