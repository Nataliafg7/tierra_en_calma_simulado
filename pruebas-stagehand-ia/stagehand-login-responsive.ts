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

    console.log("\n1. Inicio de sesión abierto en resolución móvil.");

    // OBSERVE: identificar controles disponibles del login móvil.
    const controlesLogin = await stagehand.observe(
      "Identifica el campo Correo y el botón Ingresar visibles en el formulario de inicio de sesión móvil.",
      {
        page,
        timeout: 45000,
      }
    );

    console.log("\n2. Resultado de observe():");
    console.log(JSON.stringify(controlesLogin, null, 2));

    if (controlesLogin.length < 2) {
      throw new Error("No se identificaron los controles esperados del login móvil.");
    }

    // ACT: escribir un correo sin iniciar sesión.
    const escribirCorreo = await stagehand.act(
      "Escribe responsive_stagehand@gmail.com en el campo Correo del formulario de inicio de sesión. No presiones el botón Ingresar.",
      {
        page,
        timeout: 45000,
      }
    );

    console.log("\n3. Resultado de act():");
    console.log(escribirCorreo);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    // EXTRACT: comprobar información visible.
    const informacionLogin = await stagehand.extract(
      "Extrae el título visible del formulario de inicio de sesión y el valor escrito en el campo Correo.",
      z.object({
        titulo: z.string(),
        correo: z.string(),
      }),
      {
        page,
        selector: ".form-box.login",
        timeout: 45000,
      }
    );

    console.log("\n4. Resultado de extract():");
    console.log(JSON.stringify(informacionLogin, null, 2));

    if (!informacionLogin.titulo.toLowerCase().includes("inicio")) {
      throw new Error("No se identificó el título del formulario móvil.");
    }

    if (informacionLogin.correo !== "responsive_stagehand@gmail.com") {
      throw new Error("No se extrajo correctamente el correo en vista móvil.");
    }

    console.log(
      "\nPRUEBA EXITOSA: Stagehand identificó y validó los controles del login en resolución móvil."
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