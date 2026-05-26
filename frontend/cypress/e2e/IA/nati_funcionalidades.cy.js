describe('Pruebas IA - Funcionalidades Natalia - Tierra en Calma', () => {
  it('Envío de mensaje mediante formulario de contacto', () => {
    cy.visit('/');

    // Simula una respuesta exitosa del backend para validar la interfaz
    cy.intercept('POST', '**/api/contacto', {
      statusCode: 200,
      body: {
        message: 'Mensaje enviado correctamente'
      }
    }).as('enviarContacto');

    // Captura la alerta mostrada al usuario
    cy.window().then((ventana) => {
      cy.stub(ventana, 'alert').as('alertaContacto');
    });

    // Diligencia el formulario
    cy.get('[name="nombre"]')
      .clear()
      .type('Natalia Florez')
      .should('have.value', 'Natalia Florez');

    cy.get('[name="correo"]')
      .clear()
      .type('natiprueba@gmail.com')
      .should('have.value', 'natiprueba@gmail.com');

    cy.get('[name="mensaje"]')
      .clear()
      .type('Solicito información sobre el monitoreo y cuidado de mi planta.')
      .should(
        'have.value',
        'Solicito información sobre el monitoreo y cuidado de mi planta.'
      );

    // Envía el formulario
    cy.get('#footer button')
      .should('be.visible')
      .and('not.be.disabled')
      .click();

    // Comprueba que la interfaz realizó la solicitud
    cy.wait('@enviarContacto')
      .its('response.statusCode')
      .should('eq', 200);

    // Comprueba que el usuario recibe confirmación visible
    cy.get('@alertaContacto').should(
      'have.been.calledWithMatch',
      /tu mensaje fue enviado correctamente/i
    );
  });
  it('Verificación manual mediante la opción Verificar condiciones', () => {
    const idPlantaUsuario = 26;

    // Simula datos visibles de monitoreo para mantener estable la interfaz.
    cy.intercept('GET', '**/api/datos', {
      statusCode: 200,
      body: {
        dato: 'T:24.50,H:55.80%'
      }
    }).as('consultarDatos');

    cy.intercept('GET', '**/api/historial', {
      statusCode: 200,
      body: {
        historial: ['T:24.50,H:55.80%']
      }
    }).as('consultarHistorial');

    // Simula la respuesta exitosa de la verificación manual.
    cy.intercept('POST', '**/api/verificar-condiciones', {
      statusCode: 200,
      body: {
        ok: true,
        mensaje: 'Riego automático activado. Última lectura disponible.'
      }
    }).as('verificarCondiciones');

    // Abre la pantalla usando el parámetro real esperado por el componente.
    cy.visit(`/monstera?pu=${idPlantaUsuario}`);

    // Captura la alerta que se muestra después de verificar condiciones.
    cy.window().then((ventana) => {
      cy.stub(ventana, 'alert').as('alertaCondiciones');
    });

    // Verifica que la opción esté visible y ejecuta la acción.
    cy.contains('button', 'Verificar condiciones', { timeout: 10000 })
      .should('be.visible')
      .click();

    // Comprueba que se haya ejecutado la solicitud.
    cy.wait('@verificarCondiciones')
      .its('response.statusCode')
      .should('eq', 200);

    // Comprueba el resultado visible para el usuario.
    cy.get('@alertaCondiciones').should(
      'have.been.calledWithMatch',
      /Riego automático activado/i
    );
  });
    it('Visualización de la última lectura de humedad y temperatura', () => {
    const idPlantaUsuario = 26;

    // Simula una lectura disponible para validar su visualización en la interfaz.
    cy.intercept('GET', '**/api/datos', {
      statusCode: 200,
      body: {
        dato: 'T:24.50,H:55.80%'
      }
    }).as('consultarUltimaLectura');

    cy.intercept('GET', '**/api/historial', {
      statusCode: 200,
      body: {
        historial: ['T:24.50,H:55.80%']
      }
    }).as('consultarHistorial');

    // Abre la vista con el ID de planta que ya te funcionó.
    cy.visit(`/monstera?pu=${idPlantaUsuario}`);

    // Espera la consulta de la lectura.
    cy.wait('@consultarUltimaLectura');

    // Verifica que los valores interpretados se muestren en pantalla.
    cy.contains('24.50 °C', { timeout: 10000 })
      .should('be.visible');

    cy.contains(/55\.80\s*%/, { timeout: 10000 })
      .should('be.visible');
  });
    it('Generación simulada de datos de temperatura y humedad', () => {
    const idPlantaUsuario = 26;
    let numeroConsulta = 0;

    // Simula lecturas diferentes en consultas sucesivas.
    cy.intercept('GET', '**/api/datos', (req) => {
      numeroConsulta += 1;

      const dato =
        numeroConsulta === 1
          ? 'T:24.50,H:55.80%'
          : 'T:25.10,H:57.20%';

      req.reply({
        statusCode: 200,
        body: { dato }
      });
    }).as('datosSimulados');

    cy.intercept('GET', '**/api/historial', {
      statusCode: 200,
      body: {
        historial: [
          'T:24.50,H:55.80%',
          'T:25.10,H:57.20%'
        ]
      }
    }).as('historialSimulado');

    cy.visit(`/monstera?pu=${idPlantaUsuario}`);

    // Primera lectura simulada.
    cy.wait('@datosSimulados');

    cy.contains(/24\.50\s*°C/, { timeout: 10000 })
      .should('be.visible');

    cy.contains(/55\.80\s*%/, { timeout: 10000 })
      .should('be.visible');

    // Segunda lectura producida por la actualización periódica.
    cy.wait('@datosSimulados', { timeout: 10000 });

    cy.contains(/25\.10\s*°C/, { timeout: 10000 })
      .should('be.visible');

    cy.contains(/57\.20\s*%/, { timeout: 10000 })
      .should('be.visible');
  });
});