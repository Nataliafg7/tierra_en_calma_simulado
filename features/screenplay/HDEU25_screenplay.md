# HDEU25 - Generación del gráfico humedad-temperatura

## Actor
Usuario de Tierra en Calma

## Objetivo
Visualizar gráficamente los datos de humedad y temperatura de la planta Monstera.

## Tareas
- Ingresar a la vista de monitoreo de la planta.
- Consultar las lecturas ambientales.
- Validar que existan datos válidos de temperatura y humedad.
- Agregar los valores recibidos al gráfico.
- Verificar las condiciones ambientales de la planta.
- Controlar errores si no existe un ID válido o si falla el servicio.

## Interacciones
- El sistema consulta los datos ambientales.
- El sistema extrae los valores de temperatura y humedad.
- El sistema agrega los valores al gráfico humedad-temperatura.
- El usuario solicita verificar condiciones ambientales.
- El sistema consulta el backend para validar las condiciones.

## Resultados esperados
- Si llegan datos válidos, se agregan puntos de temperatura y humedad al gráfico.
- Si la lectura es inválida, no se agregan puntos al gráfico.
- Si no existe un ID válido de planta, se muestra: "Falta ID de planta".
- Si falla la verificación de condiciones, se muestra: "Error al verificar las condiciones".
- El sistema debe controlar los errores sin romper la interfaz.