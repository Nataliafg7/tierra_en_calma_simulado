/// <reference types="cypress" />

describe('API - HU10 Catálogo de plantas', () => {
  it('API-04: consulta las plantas disponibles para registrar', () => {
    cy.request({
      method: 'GET',
      url: 'http://localhost:3000/api/plantas'
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.be.an('array');
      expect(response.body.length).to.be.greaterThan(0);
    });
  });
});