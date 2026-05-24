/// <reference types="cypress" />

describe('API - HU1 Registro de usuario', () => {
  it('API-01: registra un usuario con datos válidos', () => {
    const numero = Date.now();
    const identificacion = String(numero).slice(-10);
    const correo = `api_prueba_${numero}@gmail.com`;

    cy.request({
      method: 'POST',
      url: 'http://localhost:3000/api/register',
      body: {
        id_usuario: identificacion,
        nombre: 'Prueba',
        apellido: 'CypressAPI',
        telefono: '3127765569',
        correo_electronico: correo,
        contrasena: 'Pruebapruebita'
      }
    }).then((response) => {
      expect(response.status).to.eq(200);
    });
  });
});