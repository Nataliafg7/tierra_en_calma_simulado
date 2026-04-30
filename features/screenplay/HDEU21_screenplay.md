# HDEU21 - Actualización de lecturas ambientales

## Actor
Usuario de Tierra en Calma

## Objetivo
Visualizar las lecturas ambientales actualizadas de temperatura y humedad de la planta.

## Tareas
- Ingresar a la vista de monitoreo de la planta Monstera.
- Consultar los datos ambientales disponibles.
- Validar si la lectura recibida contiene temperatura, humedad o ambas.
- Actualizar los valores visibles en la interfaz.
- Registrar puntos para el gráfico cuando los datos sean válidos.
- Ejecutar riego automático cuando la humedad sea menor a 30.

## Interacciones
- El sistema consulta el servicio de datos ambientales.
- El sistema interpreta las lecturas recibidas.
- El sistema actualiza la temperatura y la humedad en pantalla.
- El sistema agrega puntos de temperatura y humedad para el gráfico.
- El sistema registra riego automático si la humedad es baja.

## Resultados esperados
- Si la lectura es inválida, no se actualizan temperatura ni humedad.
- Si llega solo temperatura, se actualiza únicamente la temperatura.
- Si llega solo humedad, se actualiza únicamente la humedad.
- Si llegan temperatura y humedad válidas, se actualizan ambos valores.
- Si la humedad es menor a 30, se registra el evento "Riego automático ejecutado".