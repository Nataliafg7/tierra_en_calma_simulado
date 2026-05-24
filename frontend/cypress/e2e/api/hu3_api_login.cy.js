/// <reference types="cypress" />

describe('API - HU3 Inicio de sesión', () => {
  it('API-02: permite iniciar sesión con credenciales válidas', () => {
    cy.request({
      method: 'POST',
      url: 'http://localhost:3000/api/login',
      body: {
        correo_electronico: 'jjuliana@gmail.com',
        contrasena: 'Casasjuliana28'
      }
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.exist;

      cy.log(JSON.stringify(response.body));
    });
  });

  it('API-03: rechaza credenciales inválidas', () => {
    cy.request({
      method: 'POST',
      url: 'http://localhost:3000/api/login',
      failOnStatusCode: false,
      body: {
        correo_electronico: 'usuario_inexistente@gmail.com',
        contrasena: 'ClaveIncorrecta123'
      }
    }).then((response) => {
      expect(response.status).to.not.eq(200);
    });
  });
});