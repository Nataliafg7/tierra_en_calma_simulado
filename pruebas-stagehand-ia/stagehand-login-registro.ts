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

    console.log("\n1. Página de login abierta correctamente.");

    // ACT: la IA identifica y ejecuta la acción para abrir el registro
    const resultadoAct = await stagehand.act(
      "Haz clic en el botón visible que dice 'Regístrate' para abrir el formulario de registro.",
      {
        page,
        timeout: 45000,
      }
    );

    console.log("\n2. Resultado de act():");
    console.log(resultadoAct);

    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Validación técnica de apoyo: confirmar que el cambio sí ocurrió
    const tituloRegistroVisible = await page
      .locator(".form-box.register h1")
      .isVisible();

    const textoTituloRegistro = await page
      .locator(".form-box.register h1")
      .innerText();

    if (!tituloRegistroVisible || !textoTituloRegistro.includes("Registro")) {
      throw new Error("El formulario de registro no quedó visible después del clic.");
    }

    console.log("\n3. El formulario de registro ya está visible.");

    // OBSERVE: la IA identifica elementos visibles del registro
    const accionesObservadas = await stagehand.observe(
      "Encuentra los campos de entrada y el botón Registrar visibles dentro del formulario de registro.",
      {
        page,
        timeout: 45000,
      }
    );

    console.log("\n4. Resultado de observe():");
    console.log(JSON.stringify(accionesObservadas, null, 2));

    if (accionesObservadas.length === 0) {
      throw new Error("observe() no identificó elementos visibles del formulario de registro.");
    }

    // EXTRACT: la IA extrae información estructurada de la pantalla
    const datosRegistro = await stagehand.extract(
      "Extrae el título principal del formulario de registro visible y los nombres de todos sus campos visibles.",
      z.object({
        titulo: z.string().describe("Título visible del formulario"),
        camposVisibles: z.array(z.string()).describe("Nombres de los campos visibles"),
      }),
      {
        page,
        selector: ".form-box.register",
        timeout: 45000,
      }
    );

    console.log("\n5. Resultado de extract():");
    console.log(JSON.stringify(datosRegistro, null, 2));

    if (!datosRegistro.titulo.toLowerCase().includes("registro")) {
      throw new Error("extract() no identificó correctamente el título Registro.");
    }

    if (datosRegistro.camposVisibles.length === 0) {
      throw new Error("extract() no identificó los campos visibles del registro.");
    }

    console.log(
      "\nPRUEBA EXITOSA: Stagehand utilizó act(), observe() y extract() correctamente."
    );

    await new Promise((resolve) => setTimeout(resolve, 5000));
  } catch (error) {
    console.error("\nERROR EN LA PRUEBA STAGEHAND:");
    console.error(error);
    process.exitCode = 1;
  } finally {
    await stagehand.close();
  }
}

ejecutarPrueba();