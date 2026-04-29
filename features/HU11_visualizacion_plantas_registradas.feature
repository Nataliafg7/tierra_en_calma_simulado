Feature: HU11 - Visualización de plantas registradas
  Como usuario autenticado de Tierra en Calma
  Quiero visualizar las plantas que tengo registradas
  Para consultar su información y acceder a sus opciones de monitoreo

  Scenario: HU11F_P1 - Debe redirigir al login si la sesión es inválida
    Given el usuario no tiene una sesión válida
    When ingresa a la vista de mis plantas
    Then el sistema debe mostrar el mensaje "Sesión inválida. Inicia sesión nuevamente."
    And debe redirigir al usuario a la vista de login

  Scenario: HU11F_P2 - Debe cargar correctamente las plantas del usuario
    Given el usuario tiene una sesión válida
    When ingresa a la vista de mis plantas
    And el sistema consulta sus plantas registradas
    Then debe mostrar el nombre del usuario
    And debe cargar la lista de plantas asociadas al usuario
    And debe iniciar la paginación en la primera página

  Scenario: HU11F_P3 - Debe manejar correctamente una lista vacía de plantas
    Given el usuario tiene una sesión válida
    When ingresa a la vista de mis plantas
    And el sistema no encuentra plantas registradas
    Then debe mantener la lista de plantas vacía
    And debe conservar la paginación en la primera página

  Scenario: HU11F_P4 - Debe mostrar alerta si ocurre un error al cargar las plantas
    Given el usuario tiene una sesión válida
    When ingresa a la vista de mis plantas
    And ocurre un error al consultar sus plantas
    Then debe mostrar el mensaje "No fue posible cargar tus plantas."
    And no debe cargar plantas en la vista

  Scenario: HU11F_P5 - Debe asignar lista vacía si la respuesta no es un arreglo
    Given el usuario tiene una sesión válida
    When ingresa a la vista de mis plantas
    And el sistema recibe una respuesta con formato inesperado
    Then debe asignar una lista vacía de plantas
    And debe mantener la paginación en la primera página

  Scenario: HU11F_P7 - Debe mostrar alerta si la planta es inválida para monitoreo
    Given el usuario se encuentra en la vista de mis plantas
    And selecciona una planta sin identificador válido
    When intenta monitorear la planta
    Then debe mostrar el mensaje "Planta inválida (falta ID_PLANTA_USUARIO)"

  Scenario: HU11F_P8 - Debe mostrar alerta si el backend falla al preparar el monitoreo
    Given el usuario se encuentra en la vista de mis plantas
    And selecciona una planta válida
    When intenta iniciar el monitoreo de la planta
    And el backend responde con un error
    Then debe mostrar el mensaje "No se pudo preparar el monitoreo."

  Scenario: HU11F_P9 - Debe navegar a la vista de registrar plantas
    Given el usuario se encuentra en la vista de mis plantas
    When selecciona la opción de registrar una nueva planta
    Then el sistema debe redirigirlo a la vista de registrar plantas

  Scenario: HU11F_P11 - Debe devolver la clase visual por defecto para una planta no mapeada
    Given existe una planta que no coincide con los tipos visuales definidos
    When el sistema asigna la clase visual de la planta
    Then debe retornar la clase visual por defecto "ceriman-card"

  Scenario: HU11F_P13 - Debe navegar según el tipo de planta Dólar
    Given el usuario se encuentra en la vista de mis plantas
    And tiene registrada una planta de tipo Dólar
    When selecciona la planta
    Then el sistema debe ejecutar la navegación correspondiente para la planta Dólar

  Scenario: HU11F_P15 - Debe retroceder el carrusel
    Given el usuario se encuentra en la vista de mis plantas
    And el carrusel está ubicado después de la primera planta
    When selecciona la opción de retroceder
    Then el carrusel debe volver a la posición anterior
    And debe actualizar el desplazamiento visual