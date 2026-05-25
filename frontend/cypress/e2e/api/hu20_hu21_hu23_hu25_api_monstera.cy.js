/// <reference types="cypress" />

describe('API - Servicios de monitoreo y cuidado de Monstera', () => {

  const apiUrl = 'http://localhost:3000/api';

  // =============================
  // HU21 - LECTURAS AMBIENTALES
  // =============================
  it('API-ANGIE-01: consulta la última lectura ambiental disponible - HU21', () => {
    cy.request({
      method: 'GET',
      url: `${apiUrl}/datos`
    }).then((response) => {
      expect(response.status).to.eq(200);

      expect(response.body)
        .to.have.property('dato');

      expect(response.body.dato)
        .to.exist;
    });
  });

  // =============================
  // HU20 - HISTORIAL
  // =============================
  it('API-ANGIE-02: consulta el historial de eventos registrados - HU20', () => {
    cy.request({
      method: 'GET',
      url: `${apiUrl}/historial`
    }).then((response) => {
      expect(response.status).to.eq(200);

      expect(response.body)
        .to.have.property('historial');

      expect(response.body.historial)
        .to.be.an('array');
    });
  });

  // =============================
  // HU23 - REGISTRO DE CUIDADOS
  // =============================
  it('API-ANGIE-03: rechaza el registro de cuidado cuando falta la fecha - HU23', () => {
    cy.request({
      method: 'POST',
      url: `${apiUrl}/cuidados`,
      failOnStatusCode: false,
      body: {
        id_planta_usuario: 10,
        tipo: 'poda',
        detalles: 'Retiro de hojas secas'
      }
    }).then((response) => {
      expect(response.status).to.eq(400);

      expect(response.body)
        .to.have.property(
          'error',
          'id_planta_usuario, fecha y tipo son obligatorios'
        );
    });
  });

  it('API-ANGIE-04: rechaza el registro de cuidado cuando falta el tipo - HU23', () => {
    cy.request({
      method: 'POST',
      url: `${apiUrl}/cuidados`,
      failOnStatusCode: false,
      body: {
        id_planta_usuario: 10,
        fecha: '2026-04-03',
        detalles: 'Retiro de hojas secas'
      }
    }).then((response) => {
      expect(response.status).to.eq(400);

      expect(response.body)
        .to.have.property(
          'error',
          'id_planta_usuario, fecha y tipo son obligatorios'
        );
    });
  });

  it('API-ANGIE-05: rechaza el registro de cuidado cuando falta el identificador de planta - HU23', () => {
    cy.request({
      method: 'POST',
      url: `${apiUrl}/cuidados`,
      failOnStatusCode: false,
      body: {
        fecha: '2026-04-03',
        tipo: 'poda',
        detalles: 'Retiro de hojas secas'
      }
    }).then((response) => {
      expect(response.status).to.eq(400);

      expect(response.body)
        .to.have.property(
          'error',
          'id_planta_usuario, fecha y tipo son obligatorios'
        );
    });
  });

  // =============================
  // HU25 - VERIFICAR CONDICIONES
  // =============================
  it('API-ANGIE-06: rechaza la verificación cuando no se envía el id de planta - HU25', () => {
    cy.request({
      method: 'POST',
      url: `${apiUrl}/verificar-condiciones`,
      failOnStatusCode: false,
      body: {}
    }).then((response) => {
      expect(response.status).to.eq(400);

      expect(response.body)
        .to.deep.equal({
          ok: false,
          error: 'id_planta_usuario inválido'
        });
    });
  });

  it('API-ANGIE-07: rechaza la verificación cuando el id de planta no es numérico - HU25', () => {
    cy.request({
      method: 'POST',
      url: `${apiUrl}/verificar-condiciones`,
      failOnStatusCode: false,
      body: {
        id_planta_usuario: 'planta-invalida'
      }
    }).then((response) => {
      expect(response.status).to.eq(400);

      expect(response.body)
        .to.deep.equal({
          ok: false,
          error: 'id_planta_usuario inválido'
        });
    });
  });

});