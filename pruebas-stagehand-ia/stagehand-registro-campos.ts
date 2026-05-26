import "dotenv/config";
import { Stagehand } from "@browserbasehq/stagehand";
import { z } from "zod";

async function abrirFormularioRegistro(page: any): Promise<void> {
  /*
   * La apertura del formulario se realiza con selectores estables,
   * porque la funcionalidad que queremos evaluar con IA está dentro
   * del formulario de registro: observar, actuar y extraer datos.
   */
  const selectoresRegistro = [
    "//button[contains(., 'Regístrate')]",
    "//button[contains(., 'Registrate')]",
    "//button[contains(., 'Registrarse')]",
    "//button[contains(., 'Registro')]",
    "//a[contains(., 'Regístrate')]",
    "//a[contains(., 'Registrate')]",
    "//a[contains(., 'Registrarse')]",
    ".register-btn",
    "button.register-btn",
    ".toggle-panel.toggle-right button",
  ];

  for (const selector of selectoresRegistro) {
    try {
      const control = page.locator(selector);

      if (await control.isVisible()) {
        await control.click();
        await page.waitForTimeout(1200);

        const formularioVisible = await page
          .locator(".form-box.register h1")
          .isVisible();

        if (formularioVisible) {
          console.log(
            `\n2. Formulario de registro abierto correctamente con el control: ${selector}`
          );
          return;
        }
      }
    } catch {
      // Si un selector no existe, continúa con el siguiente.
    }
  }

  throw new Error(
    "No fue posible encontrar el control visible que abre el formulario de registro."
  );
}

async function ejecutarPrueba() {
  const stagehand = new Stagehand({
    env: "LOCAL",
    model: "google/gemini-2.5-flash",
    verbose: 1,
    localBrowserLaunchOptions: {
      headless: false,
      viewport: {
        width: 1280,
        height: 800,
      },
    },
  });

  try {
    await stagehand.init();

    const page = stagehand.context.pages()[0];

    await page.goto("http://localhost:4200/login");
    await page.waitForTimeout(1500);

    console.log("\n======================================================");
    console.log("STAGEHAND - PRUEBA IA DE REGISTRO");
    console.log("HU1 - OBSERVE, ACT Y EXTRACT");
    console.log("======================================================");

    console.log("\n1. Pantalla de inicio de sesión abierta correctamente.");

    await abrirFormularioRegistro(page);

    const tituloRegistro = await page
      .locator(".form-box.register h1")
      .innerText();

    if (!tituloRegistro.includes("Registro")) {
      throw new Error("El formulario visible no corresponde al registro.");
    }

    console.log("\n3. Título visible del formulario:");
    console.log(tituloRegistro);

    /*
     * OBSERVE:
     * Stagehand utiliza Gemini para identificar un elemento real
     * del formulario de registro visible.
     */
    const campoNombreObservado = await stagehand.observe(
      "Identifica el campo visible donde el usuario debe escribir su Nombre dentro del formulario de Registro.",
      {
        page,
        selector: ".form-box.register",
        timeout: 45000,
      }
    );

    console.log("\n4. Resultado de observe() al identificar el campo Nombre:");
    console.log(JSON.stringify(campoNombreObservado, null, 2));

    if (campoNombreObservado.length === 0) {
      throw new Error(
        "observe() no identificó el campo Nombre del formulario de registro."
      );
    }

    /*
     * ACT:
     * Stagehand utiliza IA para escribir un valor en el campo Nombre.
     * Esta es la acción inteligente evaluada en la prueba.
     */
    const escribirNombre = await stagehand.act(
      "Escribe exactamente PruebaIA en el campo visible llamado Nombre del formulario de Registro.",
      {
        page,
        timeout: 45000,
      }
    );

    console.log("\n5. Resultado de act() al diligenciar el campo Nombre:");
    console.log(JSON.stringify(escribirNombre, null, 2));

    if (!escribirNombre.success) {
      throw new Error(
        "act() no logró diligenciar el campo Nombre mediante inteligencia artificial."
      );
    }

    const nombreEscrito = await page
      .locator('input[name="regNombre"]')
      .inputValue();

    if (nombreEscrito !== "PruebaIA") {
      throw new Error(
        `El campo Nombre no contiene el valor esperado. Valor encontrado: ${nombreEscrito}`
      );
    }

    /*
     * Los otros campos se llenan de manera determinística.
     * No se envía el formulario ni se crea información en la aplicación.
     */
    await page
      .locator('input[name="regIdUsuario"]')
      .fill("1234567890");

    await page
      .locator('input[name="regCorreo"]')
      .fill("prueba_stagehand@gmail.com");

    console.log(
      "\n6. Campos Identificación y Correo diligenciados sin enviar el formulario."
    );

    await page.waitForTimeout(1000);

    /*
     * EXTRACT:
     * Stagehand utiliza Gemini para extraer los valores visibles
     * escritos en el formulario.
     */
    const datosIngresados = await stagehand.extract(
      "Extrae exactamente los valores actualmente escritos en los campos Identificación, Nombre y Correo del formulario de Registro visible. No traduzcas ni cambies ningún valor.",
      z.object({
        identificacion: z
          .string()
          .describe("Valor actualmente escrito en el campo Identificación"),
        nombre: z
          .string()
          .describe("Valor actualmente escrito en el campo Nombre"),
        correo: z
          .string()
          .describe("Valor actualmente escrito en el campo Correo"),
      }),
      {
        page,
        selector: ".form-box.register",
        timeout: 45000,
      }
    );

    console.log("\n7. Resultado de extract():");
    console.log(JSON.stringify(datosIngresados, null, 2));

    if (datosIngresados.identificacion !== "1234567890") {
      throw new Error(
        "El valor extraído del campo Identificación no coincide."
      );
    }

    if (datosIngresados.nombre !== "PruebaIA") {
      throw new Error(
        "El valor extraído del campo Nombre no coincide."
      );
    }

    if (datosIngresados.correo !== "prueba_stagehand@gmail.com") {
      throw new Error(
        "El valor extraído del campo Correo no coincidee."
      );
    }

    console.log("\n======================================================");
    console.log("RESULTADO STAGEHAND - HU1 REGISTRO");
    console.log("======================================================");
    console.log(
      "\nPRUEBA EXITOSA: Stagehand utilizó observe() para identificar el campo Nombre, act() para diligenciarlo mediante IA y extract() para validar los datos escritos en el formulario sin enviarlo."
    );

    await page.waitForTimeout(5000);
  } catch (error) {
    console.error("\nERROR EN LA PRUEBA STAGEHAND:");
    console.error(error);
    process.exitCode = 1;
  } finally {
    await stagehand.close();
  }
}

ejecutarPrueba();