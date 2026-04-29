Feature: HU3 - Inicio de sesión
  Como usuario registrado
  Quiero iniciar sesión en Tierra en Calma
  Para acceder a las funcionalidades del sistema según mi tipo de usuario

  Scenario: HU3F_P1 - No debe iniciar sesión si los campos obligatorios están vacíos
    Given el usuario se encuentra en la vista de inicio de sesión
    And deja vacío el correo o la contraseña
    When intenta enviar el formulario de inicio de sesión
    Then el sistema debe detener el envío del formulario
    And debe mostrar el mensaje "Ingresa tu correo y contraseña."
    And no debe guardar información de sesión
    And no debe redirigir al usuario

  Scenario: HU3F_P2 - Inicio de sesión exitoso como administrador
    Given el usuario se encuentra en la vista de inicio de sesión
    And diligencia credenciales válidas de administrador
    When envía el formulario de inicio de sesión
    Then el sistema debe autenticar al usuario correctamente
    And debe mostrar el mensaje "Bienvenid@ Administrador"
    And debe guardar la información del usuario en sesión
    And debe redirigir al usuario a la vista de administrador

  Scenario: HU3F_P3 - Inicio de sesión exitoso como usuario normal
    Given el usuario se encuentra en la vista de inicio de sesión
    And diligencia credenciales válidas de usuario normal
    When envía el formulario de inicio de sesión
    Then el sistema debe autenticar al usuario correctamente
    And debe mostrar el mensaje "Bienvenid@ Juliana"
    And debe guardar la información del usuario en sesión
    And debe redirigir al usuario a la vista de mis plantas

  Scenario: HU3F_P4 - No debe iniciar sesión cuando la respuesta contiene un usuario inválido
    Given el usuario se encuentra en la vista de inicio de sesión
    And diligencia credenciales válidas
    When envía el formulario de inicio de sesión
    And el sistema recibe una respuesta con información de usuario incompleta
    Then debe mostrar el mensaje "Credenciales inválidas. Verifica tu correo o contraseña."
    And no debe guardar información de sesión
    And no debe redirigir al usuario

  Scenario: HU3F_P5 - Debe mostrar error cuando no hay conexión con el backend
    Given el usuario se encuentra en la vista de inicio de sesión
    And diligencia credenciales válidas
    When envía el formulario de inicio de sesión
    And ocurre un error de conexión con el servidor
    Then debe mostrar el mensaje "No se pudo conectar con el servidor. Verifica el backend."
    And no debe guardar información de sesión
    And no debe redirigir al usuario

  Scenario: HU3F_P7 - Debe mostrar mensaje genérico cuando el backend no envía mensaje de error
    Given el usuario se encuentra en la vista de inicio de sesión
    And diligencia credenciales válidas
    When envía el formulario de inicio de sesión
    And el backend responde con un error sin mensaje específico
    Then debe mostrar el mensaje "Credenciales inválidas."
    And no debe guardar información de sesión
    And no debe redirigir al usuario

  Scenario: HU3F_P8 - Debe iniciar sesión cuando el usuario llega dentro de un arreglo
    Given el usuario se encuentra en la vista de inicio de sesión
    And diligencia credenciales válidas
    When envía el formulario de inicio de sesión
    And el sistema recibe la información del usuario dentro de un arreglo
    Then debe tomar el primer usuario del arreglo
    And debe mostrar el mensaje "Bienvenid@ Juliana"
    And debe guardar la información del usuario en sesión
    And debe redirigir al usuario a la vista de mis plantas

  Scenario: HU3F_P9 - No debe llamar el servicio de login si los campos están vacíos
    Given el usuario se encuentra en la vista de inicio de sesión
    And deja vacío el correo y la contraseña
    When intenta enviar el formulario de inicio de sesión
    Then el sistema debe detener el envío del formulario
    And debe mostrar el mensaje "Ingresa tu correo y contraseña."
    And no debe ejecutar la autenticación
    And no debe guardar información de sesión

  Scenario: HU3F_P10 - Debe mostrar el error enviado por el backend
    Given el usuario se encuentra en la vista de inicio de sesión
    And diligencia credenciales válidas
    When envía el formulario de inicio de sesión
    And el backend responde con un mensaje de error
    Then el sistema debe mostrar el mensaje recibido desde el backend
    And no debe guardar información de sesión
    And no debe redirigir al usuario

  Scenario: HU3F_P11 - Debe mostrar error de conexión
    Given el usuario se encuentra en la vista de inicio de sesión
    And diligencia credenciales válidas
    When envía el formulario de inicio de sesión
    And no hay conexión con el servidor
    Then debe mostrar el mensaje "No se pudo conectar con el servidor. Verifica el backend."
    And no debe guardar información de sesión
    And no debe redirigir al usuario