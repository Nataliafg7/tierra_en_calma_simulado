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

    console.log("\n1. Pantalla de inicio de sesión abierta.");

    // OBSERVE: identificar elementos del login.
    const elementosLogin = await stagehand.observe(
      "Identifica el campo Correo, el campo Contraseña y el botón Ingresar visibles en el formulario de inicio de sesión.",
      {
        page,
        timeout: 45000,
      }
    );

    console.log("\n2. Resultado de observe():");
    console.log(JSON.stringify(elementosLogin, null, 2));

    if (elementosLogin.length < 3) {
      throw new Error("No se identificaron correctamente los elementos del login.");
    }

    // ACT: escribir correo de prueba sin enviar el formulario.
    const escribirCorreo = await stagehand.act(
      "Escribe prueba_login_stagehand@gmail.com en el campo Correo del formulario de inicio de sesión. No presiones Ingresar.",
      {
        page,
        timeout: 45000,
      }
    );

    console.log("\n3. Resultado de act():");
    console.log(escribirCorreo);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    // EXTRACT: extraer título y correo diligenciado.
    const datosLogin = await stagehand.extract(
      "Extrae el título del formulario visible y el valor actualmente escrito en el campo Correo del inicio de sesión.",
      z.object({
        titulo: z.string().describe("Título visible del formulario"),
        correo: z.string().describe("Valor escrito en el campo Correo"),
      }),
      {
        page,
        selector: ".form-box.login",
        timeout: 45000,
      }
    );

    console.log("\n4. Resultado de extract():");
    console.log(JSON.stringify(datosLogin, null, 2));

    if (!datosLogin.titulo.toLowerCase().includes("inicio")) {
      throw new Error("No se extrajo correctamente el título del login.");
    }

    if (datosLogin.correo !== "prueba_login_stagehand@gmail.com") {
      throw new Error("No se extrajo correctamente el correo diligenciado.");
    }

    console.log(
      "\nPRUEBA EXITOSA: Stagehand identificó los elementos del login, diligenció el correo y extrajo la información visible."
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