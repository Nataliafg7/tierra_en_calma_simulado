Feature: HDEU20 - Registro automático del evento de riego en el historial
  Como usuario de Tierra en Calma
  Quiero que cada riego ejecutado quede registrado en el historial
  Para consultar posteriormente los eventos realizados sobre la planta

  Scenario: HDEU20F_P1 - No debe registrar evento si falla el servicio de riego
    Given el usuario se encuentra en la vista de monitoreo de la planta Monstera
    And el historial de riego tiene registros previos
    And el servicio de riego responde con error
    When el usuario activa el riego manual
    Then el sistema no debe modificar el historial de riego
    And no debe agregar un evento nuevo

  Scenario: HDEU20F_P2 - Debe registrar el riego manual en el historial
    Given el usuario se encuentra en la vista de monitoreo de la planta Monstera
    And el servicio de riego responde correctamente
    When el usuario activa el riego manual
    Then el sistema debe agregar un nuevo evento al historial de riego
    And el evento debe ser de tipo "manual"
    And el mensaje del evento debe ser "Riego manual activado"

  Scenario: HDEU20F_P3 - Debe conservar máximo 10 registros en el historial
    Given el usuario se encuentra en la vista de monitoreo de la planta Monstera
    And el historial de riego ya contiene 10 registros
    When el usuario activa un nuevo riego manual exitosamente
    Then el sistema debe agregar el nuevo evento al inicio del historial
    And debe eliminar el registro más antiguo
    And el historial debe conservar máximo 10 registros