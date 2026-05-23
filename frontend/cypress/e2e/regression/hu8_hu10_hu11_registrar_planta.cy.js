/// <reference types="cypress" />

describe('HU8-HU10-HU11 - Registrar planta y visualizarla en Mis Plantas', () => {
  it('debe navegar a registrar plantas, agregar Potus y mostrarla en la lista', () => {
    const correo = 'jjuliana@gmail.com';
    const contrasena = 'Casasjuliana28';

    // Interceptar peticiones reales del flujo
    cy.intercept('POST', '**/api/login').as('login');
    cy.intercept('GET', '**/api/mis-plantas').as('misPlantas');

    // Evita respuesta 304 del catálogo para que el componente cargue plantaIds
    cy.intercept(
      {
        method: 'GET',
        url: '**/api/plantas',
        middleware: true
      },
      (req) => {
        delete req.headers['if-none-match'];
        delete req.headers['if-modified-since'];
        req.continue();
      }
    ).as('catalogoPlantas');

    cy.intercept('POST', '**/api/registrar-planta').as('registrarPlanta');

    // 1. INICIAR SESIÓN
    cy.visit('http://localhost:4200/');

    cy.contains('Iniciar sesión').click();

    cy.get('.form-box.login input[placeholder="Correo"]')
      .should('be.visible')
      .type(correo);

    cy.get('.form-box.login input[placeholder="Contraseña"]')
      .should('be.visible')
      .type(contrasena);

    cy.get('.form-box.login button[type="submit"]')
      .should('be.visible')
      .click();

    cy.wait('@login').then(({ response }) => {
      expect(response.statusCode).to.eq(200);
    });

    cy.url({ timeout: 10000 }).should('include', '/mis-plantas');

    // 2. IR AUTOMÁTICAMENTE A REGISTRAR PLANTAS
    cy.visit('http://localhost:4200/registrar-plantas');

    cy.url({ timeout: 10000 }).should('include', '/registrar-plantas');

    // 3. ESPERAR QUE EL COMPONENTE CARGUE LOS ID DE LAS PLANTAS
    cy.wait('@catalogoPlantas').then(({ response }) => {
      expect(response.statusCode).to.eq(200);
      expect(response.body).to.be.an('array').and.not.be.empty;
    });

    // 4. VERIFICAR QUE POTUS ESTÁ DISPONIBLE Y HACER CLIC AUTOMÁTICO EN AGREGAR
    cy.get('.potus-section', { timeout: 10000 })
      .should('be.visible')
      .within(() => {
        cy.contains('.planta-nombre', 'Potus')
          .should('be.visible');

        cy.contains('button.btn-anadir', 'Agregar')
          .should('be.visible')
          .then(($boton) => {
            $boton[0].click();
          });
      });

    // 5. VALIDAR QUE REALMENTE SE ENVIÓ EL REGISTRO
    cy.wait('@registrarPlanta').then(({ request, response }) => {
      expect(request.body).to.have.property('id_usuario');
      expect(request.body).to.have.property('id_planta');
      expect(response.statusCode).to.be.oneOf([200, 201]);
    });

    // 6. VALIDAR QUE REGRESA A MIS PLANTAS
    cy.url({ timeout: 10000 }).should('include', '/mis-plantas');

    // 7. VALIDAR QUE POTUS APARECE EN EL LISTADO
    cy.get('.planta-card', { timeout: 10000 })
      .should('have.length.at.least', 1);

    cy.get('.planta-nombre', { timeout: 10000 })
      .contains('Potus')
      .should('be.visible');
  });
});