Feature: HDEU21 - Actualización de lecturas ambientales
  Como usuario de Tierra en Calma
  Quiero visualizar las lecturas ambientales actualizadas de mi planta
  Para conocer su temperatura y humedad en tiempo real

  Scenario: HDEU21F_P1 - No debe actualizar lecturas si la respuesta es inválida
    Given el usuario se encuentra en la vista de monitoreo de la planta Monstera
    And el servicio de datos ambientales retorna una respuesta inválida
    When el sistema consulta las lecturas ambientales
    Then no debe actualizar la temperatura
    And no debe actualizar la humedad del suelo
    And no debe agregar puntos al gráfico

  Scenario: HDEU21F_P2 - Debe actualizar la interfaz cuando llega un dato válido sin temperatura ni humedad
    Given el usuario se encuentra en la vista de monitoreo de la planta Monstera
    And el servicio retorna un dato válido sin patrones de temperatura ni humedad
    When el sistema consulta las lecturas ambientales
    Then debe actualizar el dato recibido en tiempo real
    And debe marcar la conexión como activa
    And no debe modificar la temperatura ni la humedad

  Scenario: HDEU21F_P3 - Debe actualizar solo temperatura cuando llega lectura de temperatura
    Given el usuario se encuentra en la vista de monitoreo de la planta Monstera
    And el servicio retorna una lectura con temperatura
    When el sistema consulta las lecturas ambientales
    Then debe actualizar la temperatura
    And debe agregar un punto de temperatura
    And no debe agregar puntos de humedad

  Scenario: HDEU21F_P4 - Debe actualizar solo humedad cuando llega lectura de humedad
    Given el usuario se encuentra en la vista de monitoreo de la planta Monstera
    And el servicio retorna una lectura de humedad mayor o igual a 30
    When el sistema consulta las lecturas ambientales
    Then debe actualizar la humedad del suelo
    And debe agregar un punto de humedad
    And no debe ejecutar riego automático

  Scenario: HDEU21F_P5 - Debe actualizar temperatura y humedad cuando llegan ambas lecturas
    Given el usuario se encuentra en la vista de monitoreo de la planta Monstera
    And el servicio retorna temperatura y humedad válidas
    When el sistema consulta las lecturas ambientales
    Then debe actualizar la temperatura
    And debe actualizar la humedad del suelo
    And debe agregar puntos al gráfico de temperatura y humedad

  Scenario: HDEU21F_P6 - Debe ejecutar riego automático cuando la humedad es menor a 30
    Given el usuario se encuentra en la vista de monitoreo de la planta Monstera
    And el servicio retorna una humedad menor a 30
    When el sistema consulta las lecturas ambientales
    Then debe actualizar las lecturas recibidas
    And debe ejecutar el riego automático
    And debe registrar el evento "Riego automático ejecutado" en el historial