// Nueva

process.env.NODE_ENV = "test";

const mqttService = require("../mqttService");

describe("HU20 Backend Escenario adicional enviarComandoFisicoRiego sin conexión MQTT", () => {
  test("Debe retornar { ok:false } cuando no hay cliente MQTT conectado", async () => {
    // Arrange
    // No se inicializa broker MQTT

    // Act
    const r = await mqttService.enviarComandoFisicoRiego();

    // Assert
    expect(r).toBeDefined();
    expect(r).toHaveProperty("ok", false);
  });
});