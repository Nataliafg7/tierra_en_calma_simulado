Feature: Flujo Completo de Telemetría (E2E)

  Como usuario del sistema Tierra en Calma
  Quiero realizar el flujo completo desde el inicio de sesión hasta la verificación de mi planta
  Para asegurar que todos los módulos integrados funcionan correctamente

  Scenario: Flujo integral de monitoreo
    Given que el sistema tiene datos de prueba configurados
    When inicio sesión con credenciales válidas
    And navego a la sección "Mis Plantas"
    And selecciono monitorear la planta "Helecho"
    Then debo ver las métricas en tiempo real "22.0 °C"
    And hago clic en verificar condiciones
    And el sistema debe confirmar la "Verificación exitosa"
