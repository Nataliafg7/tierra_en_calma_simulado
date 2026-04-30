Feature: HDEU19 - Simulación de riego manual
  Como usuario de Tierra en Calma
  Quiero activar manualmente el riego de mi planta
  Para poder controlar el riego cuando lo considere necesario

  Scenario: HDEU19F_P1 - Debe cargar correctamente la pantalla de riego manual
    Given el usuario se encuentra en la vista de monitoreo de la planta Monstera
    When se carga la pantalla de simulación de riego manual
    Then el sistema debe mostrar correctamente el componente de monitoreo
    And debe permitir acceder a la opción de activar riego manual

  Scenario: HDEU19F_P2 - Debe activar el riego manual correctamente
    Given el usuario se encuentra en la vista de monitoreo de la planta Monstera
    And el servicio de riego está disponible
    When el usuario activa el riego manual
    Then el sistema debe enviar la solicitud de riego al servicio correspondiente
    And debe mostrar el mensaje "Riego activado correctamente"

  Scenario: HDEU19F_P3 - Debe manejar error cuando falla el servicio de riego
    Given el usuario se encuentra en la vista de monitoreo de la planta Monstera
    And el servicio de riego no está disponible
    When el usuario intenta activar el riego manual
    Then el sistema debe mostrar el mensaje "Error al activar el riego"
    And no debe agregar un nuevo evento al historial de riego