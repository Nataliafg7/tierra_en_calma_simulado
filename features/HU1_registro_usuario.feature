Feature: HU1 - Registro de usuario
  Como usuario nuevo
  Quiero registrarme en la plataforma Tierra en Calma
  Para poder acceder posteriormente al sistema con mis credenciales

  Scenario: HU1F_P1 - No debe registrar si faltan campos obligatorios
    Given el usuario se encuentra en la vista de registro
    And deja uno o más campos obligatorios vacíos
    When intenta enviar el formulario de registro
    Then el sistema debe detener el envío del formulario
    And debe mostrar el mensaje "Todos los campos son obligatorios."
    And no debe enviar ninguna solicitud de registro al backend

  Scenario: HU1F_P2 - Debe registrar correctamente y volver a la vista de login
    Given el usuario se encuentra en la vista de registro
    And diligencia todos los campos obligatorios con datos válidos
    When envía el formulario de registro
    Then el sistema debe enviar la solicitud de registro al backend
    And debe registrar correctamente al usuario
    And debe mostrar el mensaje "Usuario registrado con éxito."
    And debe volver a la vista de inicio de sesión

  Scenario: HU1F_P3 - Debe mostrar error y mantenerse en registro cuando falla el backend
    Given el usuario se encuentra en la vista de registro
    And diligencia todos los campos obligatorios con datos válidos
    When envía el formulario de registro
    And el backend responde con un error
    Then el sistema debe mostrar el mensaje "No se pudo registrar el usuario. Revisa los datos o intenta más tarde."
    And debe mantener al usuario en la vista de registro
    And no debe iniciar la transición hacia la vista de login