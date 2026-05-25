# UI knowledge for DeepEval

- The contact form lives in the public footer and uses the fields `nombre`, `correo`, and `mensaje`.
- The contact form submits through the `Enviar mensaje` button and should confirm a successful send.
- The login page accepts email and password and redirects authenticated users to `Mis Plantas`.
- The `Mis Plantas` view shows plant cards and a `Monitorear` button for each plant.
- `Monitorear` prepares the sensor context and navigates to the Monstera dashboard with a `pu` query parameter.
- The Monstera dashboard shows the latest temperature, soil humidity, and a connection state.
- The Monstera dashboard displays the polling note `Actualizacion cada 2s`.
- The `Verificar condiciones` action sends a manual verification request and should return a human-readable status message.
- The dashboard also exposes a chart for humidity versus temperature and a short watering history.
