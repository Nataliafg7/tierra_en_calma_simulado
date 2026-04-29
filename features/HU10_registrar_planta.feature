Feature: HU10 - Registro de planta
  Como usuario autenticado de Tierra en Calma
  Quiero añadir una planta a mi cuenta
  Para poder hacer seguimiento y visualizarla dentro de mis plantas

  Scenario: HU10F_P1 - Debe cargar las plantas al iniciar el componente
    Given el usuario ingresa a la vista de registrar plantas
    When se inicia el componente
    Then el sistema debe cargar el banco de plantas disponibles

  Scenario: HU10F_P2 - Debe cargar plantas y construir el mapa de IDs
    Given el usuario ingresa a la vista de registrar plantas
    When el sistema consulta el banco de plantas disponibles
    And el servidor responde con plantas registradas
    Then el sistema debe construir el mapa de identificadores de plantas
    And debe normalizar los nombres de las plantas

  Scenario: HU10F_P3 - Debe mostrar alerta cuando falle la carga de plantas
    Given el usuario ingresa a la vista de registrar plantas
    When el sistema intenta cargar el banco de plantas
    And ocurre un error en el servidor
    Then el sistema debe mostrar el mensaje "No se pudieron cargar las plantas desde el servidor"

  Scenario: HU10F_P4 - Debe redirigir al login si el usuario no ha iniciado sesión
    Given el usuario no ha iniciado sesión
    And se encuentra en la vista de registrar plantas
    When intenta añadir una planta
    Then el sistema debe mostrar el mensaje "Debes iniciar sesión antes de añadir plantas"
    And debe redirigir al usuario a la vista de login
    And no debe registrar la planta

  Scenario: HU10F_P5 - Debe mostrar alerta cuando no exista el ID de la planta seleccionada
    Given el usuario ha iniciado sesión
    And selecciona una planta que no tiene identificador asociado
    When intenta añadir la planta
    Then el sistema debe mostrar el mensaje "No se encontró el ID de la planta seleccionada"
    And no debe enviar la solicitud de registro de planta

  Scenario: HU10F_P6 - Debe registrar la planta correctamente y redirigir a mis plantas
    Given el usuario ha iniciado sesión
    And selecciona una planta válida
    When intenta añadir la planta
    Then el sistema debe registrar la planta correctamente
    And debe mostrar el mensaje "Planta registrada correctamente"
    And debe redirigir al usuario a la vista de mis plantas

  Scenario: HU10F_P7 - Debe mostrar alerta cuando ocurra un error al registrar la planta
    Given el usuario ha iniciado sesión
    And selecciona una planta válida
    When intenta añadir la planta
    And ocurre un error en el registro
    Then el sistema debe mostrar el mensaje "No se pudo añadir la planta"

  Scenario: HU10F_P8 - Debe usar el ID del usuario almacenado al registrar la planta
    Given el usuario ha iniciado sesión
    And su información está almacenada en la sesión
    And selecciona una planta válida
    When intenta añadir la planta
    Then el sistema debe enviar el ID del usuario autenticado
    And debe enviar el ID de la planta seleccionada