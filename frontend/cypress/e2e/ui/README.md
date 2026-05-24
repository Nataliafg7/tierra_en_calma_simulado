# UI con Cypress Studio AI

Este módulo queda como el punto de entrada para usar **Cypress Studio / Studio AI** en el flujo de interfaz.

## Cómo usarlo

1. Levanta el frontend.
2. Abre Cypress en modo interactivo:
   ```bash
   npm run e2e:cypress:open
   ```
3. Abre `ui/studio/monitoreo_ui_studio.cy.js`.
4. Usa **Studio Beta** o **New Test** para grabar el recorrido.
5. Si tienes Cypress Cloud vinculado, activa **Studio AI** para recibir sugerencias automáticas de aserciones.

## Qué cubre este spec

- Login
- Carga de mis plantas
- Click en `Monitorear`
- Navegación a monitoreo
- Lectura de sensores y botón `Verificar condiciones`

## Notas

- Studio AI requiere Cypress 15.11.0 o superior.
- Studio funciona en modo interactivo; la parte AI requiere Cypress Cloud y el proyecto vinculado.
