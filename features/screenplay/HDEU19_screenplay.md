# HDEU19 - Simulación de riego manual

## Actor
Usuario de Tierra en Calma

## Objetivo
Activar manualmente el riego de la planta Monstera desde la interfaz de monitoreo.

## Tareas
- Ingresar a la vista de monitoreo de la planta.
- Verificar que la pantalla de riego manual cargue correctamente.
- Activar el riego manual.
- Validar que el sistema envíe la solicitud al servicio de riego.
- Confirmar que se muestre el mensaje de éxito o error según la respuesta del servicio.

## Interacciones
- El usuario selecciona la opción de riego manual.
- El sistema llama al servicio de activación de riego.
- El sistema muestra una alerta informando el resultado.

## Resultados esperados
- Si el servicio responde correctamente, se muestra el mensaje: "Riego activado correctamente".
- Si el servicio falla, se muestra el mensaje: "Error al activar el riego".
- Si ocurre un error, no se agrega ningún evento al historial de riego.