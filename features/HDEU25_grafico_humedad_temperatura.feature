Feature: HDEU25 - Generación del gráfico humedad-temperatura
  Como usuario de Tierra en Calma
  Quiero visualizar un gráfico con los datos de humedad y temperatura
  Para analizar el comportamiento ambiental de mi planta

  Scenario: HDEU25F_P1 - Debe agregar datos válidos al gráfico humedad-temperatura
    Given el usuario se encuentra en la vista de monitoreo de la planta Monstera
    And el servicio retorna una lectura válida de temperatura y humedad
    When el sistema actualiza las lecturas ambientales
    Then debe agregar un punto de temperatura al gráfico
    And debe agregar un punto de humedad al gráfico
    And los valores del gráfico deben coincidir con la lectura recibida

  Scenario: HDEU25F_P2 - No debe agregar puntos al gráfico si la lectura es inválida
    Given el usuario se encuentra en la vista de monitoreo de la planta Monstera
    And el servicio retorna una lectura ambiental inválida
    When el sistema actualiza las lecturas ambientales
    Then no debe agregar puntos de temperatura al gráfico
    And no debe agregar puntos de humedad al gráfico

  Scenario: HDEU25F_P3 - No debe verificar condiciones si no hay ID de planta
    Given el usuario se encuentra en la vista de monitoreo de la planta Monstera
    And no existe un ID válido de planta
    When intenta verificar las condiciones ambientales
    Then el sistema debe mostrar el mensaje "Falta ID de planta"
    And no debe enviar la solicitud de verificación al backend

  Scenario: HDEU25F_P4 - Debe manejar error al verificar condiciones
    Given el usuario se encuentra en la vista de monitoreo de la planta Monstera
    And existe un ID válido de planta
    And el servicio de verificación de condiciones falla
    When intenta verificar las condiciones ambientales
    Then el sistema debe mostrar el mensaje "Error al verificar las condiciones"
    And debe controlar el error sin romper la interfaz