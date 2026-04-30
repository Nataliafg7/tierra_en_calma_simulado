# HDEU20 - Registro automático del evento de riego en el historial

## Actor
Usuario de Tierra en Calma

## Objetivo
Registrar automáticamente en el historial cada evento de riego ejecutado sobre la planta.

## Tareas
- Ingresar a la vista de monitoreo de la planta Monstera.
- Activar el riego manual.
- Validar que el evento se agregue al historial.
- Verificar que el historial conserve máximo 10 registros.
- Confirmar que, si el servicio falla, el historial no se modifique.

## Interacciones
- El usuario activa el riego manual.
- El sistema recibe la respuesta del servicio de riego.
- El sistema agrega un evento al historial cuando la respuesta es exitosa.
- El sistema elimina el registro más antiguo si se supera el límite de 10 eventos.

## Resultados esperados
- El evento registrado debe ser de tipo "manual".
- El mensaje del evento debe ser "Riego manual activado".
- El nuevo evento debe aparecer al inicio del historial.
- El historial debe conservar máximo 10 registros.
- Si el servicio falla, no se debe agregar ningún evento nuevo.