Feature: HU8 - Consulta del banco de especies
  Como usuario de Tierra en Calma
  Quiero consultar el banco de especies disponibles
  Para seleccionar correctamente una planta al momento de registrarla

  Scenario: HU8F_P1 - Carga exitosa del banco de especies
    Given el usuario se encuentra en la vista de registrar plantas
    When el sistema solicita el banco de especies al servidor
    And el servidor responde con una lista de plantas disponibles
    Then el sistema debe cargar correctamente las plantas
    And debe construir el mapa de identificadores de plantas
    And debe normalizar los nombres de las plantas para su uso interno

  Scenario: HU8F_P2 - Error al cargar el banco de especies
    Given el usuario se encuentra en la vista de registrar plantas
    When el sistema solicita el banco de especies al servidor
    And el servidor responde con un error
    Then el sistema debe informar que no se pudieron cargar las plantas desde el servidor
    And no debe construir el mapa de identificadores de plantas
    And el componente debe mantenerse disponible para el usuario

  Scenario: HU8F_P3 - Respuesta exitosa con lista vacía
    Given el usuario se encuentra en la vista de registrar plantas
    When el sistema solicita el banco de especies al servidor
    And el servidor responde con una lista vacía
    Then el sistema debe mantener vacío el mapa de identificadores de plantas
    And debe conservar el componente en estado válido