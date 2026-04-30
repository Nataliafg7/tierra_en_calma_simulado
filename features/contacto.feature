Feature: Formulario de Contacto

  Como usuario interesado en el proyecto
  Quiero enviar un mensaje de contacto
  Para recibir más información sobre el monitoreo de plantas

  Background:
    Given que estoy en la página principal

  Scenario: ContactoF_P1 - Visualización del formulario
    Then debo ver el formulario de contacto
    And el botón de envío debe estar visible

  Scenario: ContactoF_P2 - Validación de campos vacíos
    Then el botón de envío debe estar deshabilitado

  Scenario: ContactoF_P3 - Envío exitoso del formulario
    When completo el formulario con nombre "Test User", correo "test@example.com" y mensaje "Prueba E2E"
    And hago clic en el botón de enviar mensaje
    Then el formulario debe reiniciarse
    And debo ver un mensaje de confirmación "fue enviado correctamente"
