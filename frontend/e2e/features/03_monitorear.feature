Feature: Monitorear Planta (F3)

  Como usuario con plantas registradas
  Quiero activar el monitoreo de una planta específica
  Para ver sus métricas detalladas

  Background:
    Given que tengo una sesión activa y plantas registradas
    And me encuentro en la sección "Mis Plantas"

  Scenario: Activación de monitoreo exitosa
    Then debo ver mi planta "Planta de Prueba" en la lista
    When hago clic en el botón de monitorear de la planta
    Then debo ser redirigido a la vista de monitoreo con ID de planta "1"
