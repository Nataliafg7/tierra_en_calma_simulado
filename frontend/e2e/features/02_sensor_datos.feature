Feature: Visualización de Sensor y Datos (F2 y F4)

  Como usuario autenticado
  Quiero ver los datos en tiempo real de mi planta
  Para monitorear su estado de salud

  Background:
    Given que he iniciado sesión exitosamente
    And accedo a la vista de monitoreo de mi planta con ID "1"

  Scenario: Visualización de lecturas actuales
    Then debo ver la lectura de temperatura "25.0 °C"
    And debo ver la lectura de humedad "60.0%"

  Scenario: Visualización del historial
    Then debo ver el gráfico del historial de lecturas
