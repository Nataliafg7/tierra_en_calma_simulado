Feature: Verificar Condiciones (F5)

  Como usuario monitoreando una planta
  Quiero verificar manualmente las condiciones de salud de mi planta
  Para asegurar que reciba el cuidado necesario

  Background:
    Given que tengo una sesión activa
    And me encuentro en la vista de la planta con ID "1"

  Scenario: Condiciones óptimas
    Given que el servidor reporta condiciones óptimas
    When hago clic en el botón de verificar condiciones
    Then debo ver una alerta con el mensaje "Condiciones óptimas"

  Scenario: Activación de riego automático
    Given que el servidor reporta que se requiere riego
    When hago clic en el botón de verificar condiciones
    Then debo ver una alerta con el mensaje "Riego automático activado"
