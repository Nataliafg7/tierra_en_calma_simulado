# HDEU23 - Registro de cuidados

## Actor
Usuario de Tierra en Calma

## Objetivo
Registrar los cuidados realizados a la planta para llevar un control de mantenimiento.

## Tareas
- Ingresar a la vista de monitoreo de la planta Monstera.
- Diligenciar el formulario de cuidado.
- Validar que exista un ID válido de planta.
- Validar que la fecha no esté vacía.
- Validar que el tipo de cuidado no esté vacío.
- Enviar el cuidado al backend.
- Limpiar el formulario cuando el registro sea exitoso.

## Interacciones
- El usuario escribe la fecha del cuidado.
- El usuario selecciona o escribe el tipo de cuidado.
- El usuario agrega detalles del cuidado.
- El sistema valida los campos obligatorios.
- El sistema envía la solicitud de registro al backend.
- El sistema muestra una alerta con el resultado.

## Resultados esperados
- Si falta el ID de planta, se muestra: "Falta id_planta_usuario".
- Si falta la fecha, se muestra: "Falta fecha (YYYY-MM-DD)".
- Si falta el tipo de cuidado, se muestra: "Falta tipo de cuidado".
- Si el backend falla, se muestra: "Error guardando el cuidado".
- Si el registro es exitoso, se muestra el mensaje de cuidado guardado y se limpia el formulario.