Feature: HDEU23 - Registro de cuidados
  Como usuario de Tierra en Calma
  Quiero registrar los cuidados realizados a mi planta
  Para llevar un control de las acciones hechas sobre ella

  Scenario: HDEU23F_P1 - No debe guardar cuidado sin ID válido de planta
    Given el usuario se encuentra en la vista de monitoreo de la planta Monstera
    And no existe un id_planta_usuario válido
    And diligencia el formulario de cuidado
    When intenta guardar el cuidado
    Then el sistema debe mostrar el mensaje "Falta id_planta_usuario"
    And no debe enviar la solicitud al backend
    And no debe limpiar el formulario

  Scenario: HDEU23F_P2 - No debe guardar cuidado sin fecha
    Given el usuario se encuentra en la vista de monitoreo de la planta Monstera
    And existe un id_planta_usuario válido
    And deja la fecha vacía
    When intenta guardar el cuidado
    Then el sistema debe mostrar el mensaje "Falta fecha (YYYY-MM-DD)"
    And no debe enviar la solicitud al backend
    And no debe limpiar el formulario

  Scenario: HDEU23F_P3 - No debe guardar cuidado sin tipo de cuidado
    Given el usuario se encuentra en la vista de monitoreo de la planta Monstera
    And existe un id_planta_usuario válido
    And deja el tipo de cuidado vacío o con espacios
    When intenta guardar el cuidado
    Then el sistema debe mostrar el mensaje "Falta tipo de cuidado"
    And no debe enviar la solicitud al backend
    And no debe limpiar el formulario

  Scenario: HDEU23F_P4 - Debe manejar error cuando falla el backend al guardar cuidado
    Given el usuario se encuentra en la vista de monitoreo de la planta Monstera
    And existe un id_planta_usuario válido
    And diligencia el formulario de cuidado con datos válidos
    And el backend responde con error
    When intenta guardar el cuidado
    Then el sistema debe mostrar el mensaje "Error guardando el cuidado"
    And no debe limpiar el formulario

  Scenario: HDEU23F_P5 - Debe registrar correctamente un cuidado con datos válidos
    Given el usuario se encuentra en la vista de monitoreo de la planta Monstera
    And existe un id_planta_usuario válido
    And diligencia fecha, tipo de cuidado y detalles válidos
    When guarda el cuidado
    Then el sistema debe enviar la solicitud al backend
    And debe mostrar el mensaje "Cuidado guardado"
    And debe limpiar el formulario de cuidado