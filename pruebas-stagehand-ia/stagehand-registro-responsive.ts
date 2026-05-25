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
        width: 375,
        height: 812,
      },
    },
  });

  try {
    await stagehand.init();

    const page = stagehand.context.pages()[0];

    await page.goto("http://localhost:4200/login");
    await new Promise((resolve) => setTimeout(resolve, 1500));

    console.log("\n1. Vista móvil del login abierta.");

    // ACT: cambiar hacia registro en vista móvil.
    const abrirRegistroMovil = await stagehand.act(
      "Haz clic en el botón Regístrate visible en la vista móvil para mostrar el formulario de registro.",
      {
        page,
        timeout: 45000,
      }
    );

    console.log("\n2. Resultado de act():");
    console.log(abrirRegistroMovil);

    await new Promise((resolve) => setTimeout(resolve, 1500));

    // OBSERVE: identificar elementos visibles del registro en móvil.
    const elementosRegistroMovil = await stagehand.observe(
      "Identifica el campo Identificación y el botón Registrar visibles en el formulario de registro móvil.",
      {
        page,
        timeout: 45000,
      }
    );

    console.log("\n3. Resultado de observe():");
    console.log(JSON.stringify(elementosRegistroMovil, null, 2));

    if (elementosRegistroMovil.length < 2) {
      throw new Error("No se identificaron los elementos del registro móvil.");
    }

    // EXTRACT: extraer datos visibles de la interfaz responsive.
    const registroMovil = await stagehand.extract(
      "Extrae el título del formulario visible y los nombres de los campos mostrados en el registro móvil.",
      z.object({
        titulo: z.string(),
        camposVisibles: z.array(z.string()),
      }),
      {
        page,
        selector: ".form-box.register",
        timeout: 45000,
      }
    );

    console.log("\n4. Resultado de extract():");
    console.log(JSON.stringify(registroMovil, null, 2));

    if (!registroMovil.titulo.toLowerCase().includes("registro")) {
      throw new Error("No se reconoció correctamente el formulario de registro móvil.");
    }

    if (registroMovil.camposVisibles.length === 0) {
      throw new Error("No se extrajeron campos visibles del registro móvil.");
    }

    console.log(
      "\nPRUEBA EXITOSA: Stagehand validó la visualización del formulario de registro en resolución móvil."
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