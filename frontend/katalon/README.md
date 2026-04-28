# Katalon Studio — Tierra en Calma (Migración desde Playwright)

## Estructura del proyecto

```
katalon/
└── Scripts/
    ├── F1_FormularioContacto/    → 01_contacto.spec.ts
    ├── F2_F4_SensorDatos/        → 02_sensor_datos.spec.ts
    ├── F3_MonitorearPlanta/      → 03_monitorear.spec.ts
    ├── F5_VerificarCondiciones/  → 04_verificar_condiciones.spec.ts
    └── E2E_FlujoCompleto/        → 05_simulador_flujo_completo.spec.ts
```

---

## Cómo importar los scripts en Katalon Studio

1. Abrir Katalon Studio y crear un nuevo proyecto (Web UI).
2. Ir a **File → Open Folder** y apuntar a este directorio `katalon/`.
3. Copiar cada carpeta de `Scripts/` al directorio `Scripts/` del proyecto de Katalon.
4. Crear los **Test Objects** listados abajo (ver sección siguiente).
5. Configurar el **Execution Profile** con la variable `BASE_URL = http://localhost:4200`.

---

## Test Objects requeridos

Cada `findTestObject('...')` en los scripts necesita un objeto en la carpeta
`Object Repository/` del proyecto. Créalos con los selectores indicados:

### F1_Contacto

| ID del objeto               | Estrategia | Selector                                              |
|-----------------------------|------------|-------------------------------------------------------|
| `F1_Contacto/form_formulario`    | XPath      | `//form`                                              |
| `F1_Contacto/btn_enviar_mensaje` | XPath      | `//button[normalize-space()='Enviar mensaje' or contains(translate(normalize-space(),'ENVIAR MENSAJE','enviar mensaje'),'enviar mensaje')]` |
| `F1_Contacto/input_nombre`       | XPath      | `//label[contains(translate(.,'NOMBRE','nombre'),'nombre')]/following-sibling::input \| //input[@id=//label[contains(translate(.,'NOMBRE','nombre'),'nombre')]/@for]` |
| `F1_Contacto/input_correo`       | XPath      | `//label[contains(translate(.,'CORREO','correo'),'correo')]/following-sibling::input \| //input[@id=//label[contains(translate(.,'CORREO','correo'),'correo')]/@for]` |
| `F1_Contacto/input_mensaje`      | XPath      | `//label[contains(translate(.,'MENSAJE','mensaje'),'mensaje')]/following-sibling::textarea \| //textarea[@id=//label[contains(translate(.,'MENSAJE','mensaje'),'mensaje')]/@for]` |

> **Tip rápido**: si los inputs tienen `formControlName`, puedes usar:
> - Nombre:  `//input[@formcontrolname='nombre']`
> - Correo:  `//input[@formcontrolname='correo']`
> - Mensaje: `//textarea[@formcontrolname='mensaje']`

---

### F2_SensorDatos

| ID del objeto                         | Estrategia | Selector                                   |
|---------------------------------------|------------|--------------------------------------------|
| `F2_SensorDatos/input_correo_login`   | XPath      | `//input[@placeholder='Correo']`           |
| `F2_SensorDatos/input_password_login` | XPath      | `//input[@placeholder='Contraseña']`       |
| `F2_SensorDatos/btn_ingresar`         | XPath      | `//button[normalize-space()='Ingresar']`   |
| `F2_SensorDatos/texto_temperatura`    | XPath      | `//*[contains(text(),'25.0') and contains(text(),'°C')]` |
| `F2_SensorDatos/texto_humedad`        | XPath      | `//*[contains(text(),'60.0%')]`            |
| `F2_SensorDatos/canvas_grafico`       | XPath      | `//canvas`                                 |

---

### F3_Monitorear

| ID del objeto                      | Estrategia | Selector                                                                |
|------------------------------------|------------|-------------------------------------------------------------------------|
| `F3_Monitorear/texto_nombre_planta`| XPath      | `//*[contains(text(),'Planta de Prueba')]`                              |
| `F3_Monitorear/btn_monitorear`     | XPath      | `(//button[contains(translate(normalize-space(),'MONITOREAR','monitorear'),'monitorear')])[1]` |

---

### F5_VerificarCondiciones

| ID del objeto                                  | Estrategia | Selector                                                                           |
|------------------------------------------------|------------|------------------------------------------------------------------------------------|
| `F5_VerificarCondiciones/btn_verificar_condiciones` | XPath | `(//button[contains(translate(normalize-space(),'VERIFICAR CONDICIONES','verificar condiciones'),'verificar condiciones')])[1]` |

---

### E2E_FlujoCompleto

| ID del objeto                                    | Estrategia | Selector                                                    |
|--------------------------------------------------|------------|-------------------------------------------------------------|
| `E2E_FlujoCompleto/input_correo_login`           | XPath      | `//input[@placeholder='Correo']`                            |
| `E2E_FlujoCompleto/input_password_login`         | XPath      | `//input[@placeholder='Contraseña']`                        |
| `E2E_FlujoCompleto/btn_ingresar`                 | XPath      | `//button[normalize-space()='Ingresar']`                    |
| `E2E_FlujoCompleto/texto_nombre_planta_helecho`  | XPath      | `//*[contains(text(),'Helecho')]`                           |
| `E2E_FlujoCompleto/btn_monitorear`               | XPath      | `(//button[contains(translate(normalize-space(),'MONITOREAR','monitorear'),'monitorear')])[1]` |
| `E2E_FlujoCompleto/texto_temperatura_22`         | XPath      | `//*[contains(text(),'22.0') and contains(text(),'°C')]`   |
| `E2E_FlujoCompleto/canvas_grafico`               | XPath      | `//canvas`                                                  |
| `E2E_FlujoCompleto/btn_verificar_condiciones`    | XPath      | `(//button[contains(translate(normalize-space(),'VERIFICAR CONDICIONES','verificar condiciones'),'verificar condiciones')])[1]` |

---

## Diferencias clave Playwright → Katalon

| Característica             | Playwright                                         | Katalon Studio (Groovy)                                  |
|----------------------------|----------------------------------------------------|----------------------------------------------------------|
| Intercepción de red        | `page.route('**/api/...')`                         | ❌ No disponible nativamente → usar mock server externo  |
| Inyectar localStorage      | `page.evaluate(() => localStorage.setItem(...))`  | `WebUI.executeJavaScript("localStorage.setItem(...)", null)` |
| Esperar alert nativo       | `page.waitForEvent('dialog')`                      | `WebUI.waitForAlert(seconds)`                            |
| Capturar texto del alert   | `dialog.message()`                                 | `WebUI.getAlertText()`                                   |
| Aceptar alert              | `dialog.accept()`                                  | `WebUI.acceptAlert()`                                    |
| Verificar URL con regex    | `expect(page).toHaveURL(/regex/)`                  | `WebUI.verifyMatch(WebUI.getUrl(), 'regex', true)`       |
| Verificar texto visible    | `expect(locator).toBeVisible()`                    | `WebUI.verifyElementVisible(findTestObject(...))`        |
| Verificar atributo         | `expect(locator).toBeDisabled()`                   | `WebUI.verifyElementAttributeValue(..., 'disabled', 'true', ...)` |
| Verificar valor de input   | `expect(locator).toHaveValue('')`                  | `WebUI.verifyElementAttributeValue(..., 'value', '', ...)` |
| Espera implícita           | `page.waitForTimeout(500)`                         | `WebUI.delay(1)` (mínimo 1 seg)                          |
| Regex en verifyMatch       | —                                                  | 3er parámetro = `true` activa modo regex                 |

---

## Recomendación para la intercepción de red

Playwright intercepta HTTP nativamante. Katalon no lo hace.
Para que las pruebas no dependan del backend real, se recomienda:

1. **json-server** (rápido para mocking REST):
   ```bash
   npx json-server --watch mock-db.json --port 3001
   ```
2. **WireMock** (más robusto, admite reglas por ruta):
   Apuntar el frontend a `http://localhost:8080` durante pruebas.
3. **Katalon + BrowserMob Proxy**: proxy de red que Katalon puede integrar
   para interceptar y reescribir respuestas (requiere plugin adicional).
