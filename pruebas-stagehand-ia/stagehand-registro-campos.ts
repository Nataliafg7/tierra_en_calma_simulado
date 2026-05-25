import "dotenv/config";
import { Stagehand } from "@browserbasehq/stagehand";
import { z } from "zod";

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
    await new Promise((resolve) => setTimeout(resolve, 1500));

    console.log("\n1. Pantalla de inicio de sesión abierta correctamente.");

    // ACT: Stagehand usa IA para abrir el formulario de registro.
    const abrirRegistro = await stagehand.act(
      "Haz clic en el botón visible que dice 'Regístrate' para abrir el formulario de registro.",
      {
        page,
        timeout: 45000,
      }
    );

    console.log("\n2. Resultado de act() al abrir registro:");
    console.log(abrirRegistro);

    await new Promise((resolve) => setTimeout(resolve, 1500));

    const tituloRegistroVisible = await page
      .locator(".form-box.register h1")
      .isVisible();

    const tituloRegistro = await page
      .locator(".form-box.register h1")
      .innerText();

    if (!tituloRegistroVisible || !tituloRegistro.includes("Registro")) {
      throw new Error("El formulario de registro no quedó visible.");
    }

    console.log("\n3. El formulario de registro está visible.");

    // OBSERVE: Stagehand usa IA para reconocer campos reales del formulario.
    const camposObservados = await stagehand.observe(
      "Identifica los campos Identificación, Nombre y Correo visibles dentro del formulario de registro.",
      {
        page,
        timeout: 45000,
      }
    );

    console.log("\n4. Resultado de observe():");
    console.log(JSON.stringify(camposObservados, null, 2));

    if (camposObservados.length < 3) {
      throw new Error("observe() no identificó los tres campos requeridos.");
    }

    // Diligenciamiento determinístico sobre campos ya reconocidos.
    // No se envía el formulario ni se registra información.
    await page
      .locator('input[name="regIdUsuario"]')
      .fill("1234567890");

    await page
      .locator('input[name="regNombre"]')
      .fill("PruebaIA");

    await page
      .locator('input[name="regCorreo"]')
      .fill("prueba_stagehand@gmail.com");

    console.log("\n5. Campos diligenciados sin enviar el formulario.");

    await new Promise((resolve) => setTimeout(resolve, 1000));

    // EXTRACT: Stagehand usa IA para extraer los datos escritos.
    const datosIngresados = await stagehand.extract(
      "Extrae exactamente los valores escritos en los campos Identificación, Nombre y Correo del formulario de registro visible.",
      z.object({
        identificacion: z
          .string()
          .describe("Valor visible escrito en el campo Identificación"),
        nombre: z
          .string()
          .describe("Valor visible escrito en el campo Nombre"),
        correo: z
          .string()
          .describe("Valor visible escrito en el campo Correo"),
      }),
      {
        page,
        selector: ".form-box.register",
        timeout: 45000,
      }
    );

    console.log("\n6. Resultado de extract():");
    console.log(JSON.stringify(datosIngresados, null, 2));

    if (datosIngresados.identificacion !== "1234567890") {
      throw new Error("El valor extraído de Identificación no coincide.");
    }

    if (datosIngresados.nombre !== "PruebaIA") {
      throw new Error("El valor extraído de Nombre no coincide.");
    }

    if (datosIngresados.correo !== "prueba_stagehand@gmail.com") {
      throw new Error("El valor extraído de Correo no coincide.");
    }

    console.log(
      "\nPRUEBA EXITOSA: Stagehand observó campos del registro y extrajo correctamente los datos diligenciados sin enviar el formulario."
    );

    await new Promise((resolve) => setTimeout(resolve, 6000));
  } catch (error) {
    console.error("\nERROR EN LA PRUEBA STAGEHAND:");
    console.error(error);
    process.exitCode = 1;
  } finally {
    await stagehand.close();
  }
}

ejecutarPrueba();