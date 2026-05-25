import "dotenv/config";
import { mkdirSync } from "node:fs";
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
        height: 900,
      },
    },
  });

  try {
    await stagehand.init();

    const page = stagehand.context.pages()[0];

    await page.goto("http://localhost:4200/monstera?pu=10");
    await new Promise((resolve) => setTimeout(resolve, 2500));

    console.log("\n1. Pantalla de monitoreo de Monstera abierta.");

    if (!page.url().includes("/monstera")) {
      throw new Error(
        "No fue posible abrir directamente la pantalla de Monstera."
      );
    }

    // ==========================================================
    // OBSERVE - HU21
    // Reconoce las lecturas visibles de la planta.
    // ==========================================================
    const elementosMonitoreo = await stagehand.observe(
      "Identifica en la pantalla de Monstera la lectura de temperatura, la lectura de humedad del suelo y el estado de conexion visible.",
      {
        page,
        timeout: 45000,
      }
    );

    console.log("\n2. Resultado de observe() para HU21:");
    console.log(JSON.stringify(elementosMonitoreo, null, 2));

    if (elementosMonitoreo.length < 3) {
      throw new Error(
        "No se identificaron temperatura, humedad y estado de conexion."
      );
    }

    // ==========================================================
    // ACT - HU25
    // Se desplaza de forma inteligente hasta el grafico.
    // ==========================================================
    const accionGrafico = await stagehand.act(
      "Desplazate hacia abajo en la pagina hasta que sea visible el grafico de relacion Humedad vs Temperatura.",
      {
        page,
        timeout: 45000,
      }
    );

    console.log("\n3. Resultado de act() para HU25:");
    console.log(JSON.stringify(accionGrafico, null, 2));

    if (!accionGrafico.success) {
      throw new Error(
        "Stagehand no logro desplazarse hasta el grafico ambiental."
      );
    }

    await new Promise((resolve) => setTimeout(resolve, 1500));

    mkdirSync("./evidencias", { recursive: true });

    await page.screenshot({
      path: "./evidencias/stagehand-angie-hu21-hu25-monstera.png",
      fullPage: true,
    });

    // ==========================================================
    // EXTRACT - HU21 y HU25
    // En una sola extraccion obtiene lecturas y titulo del grafico.
    // ==========================================================
    const resultadoMonstera = await stagehand.extract(
      "Extrae de la pagina de Monstera el valor visible de temperatura, el valor visible de humedad del suelo, el estado de conexion y el titulo visible del grafico que relaciona humedad y temperatura.",
      z.object({
        temperatura: z.string().describe("Valor visible de temperatura"),
        humedadSuelo: z.string().describe("Valor visible de humedad del suelo"),
        estadoConexion: z.string().describe("Estado visible de conexion"),
        tituloGrafico: z
          .string()
          .describe("Titulo visible del grafico humedad-temperatura"),
      }),
      {
        page,
        timeout: 45000,
      }
    );

    console.log("\n4. Resultado de extract() para HU21 y HU25:");
    console.log(JSON.stringify(resultadoMonstera, null, 2));

    if (!resultadoMonstera.temperatura.match(/\d/)) {
      throw new Error("No se extrajo un valor numerico de temperatura.");
    }

    if (!resultadoMonstera.humedadSuelo.match(/\d/)) {
      throw new Error("No se extrajo un valor numerico de humedad.");
    }

    if (
      !resultadoMonstera.estadoConexion
        .toLowerCase()
        .includes("conectado")
    ) {
      throw new Error("No se extrajo correctamente el estado de conexion.");
    }

    const titulo = resultadoMonstera.tituloGrafico.toLowerCase();

    if (!titulo.includes("humedad") || !titulo.includes("temperatura")) {
      throw new Error(
        "El titulo extraido no corresponde al grafico humedad-temperatura."
      );
    }

    console.log("\n==============================================");
    console.log("PRUEBA EXITOSA: STAGEHAND-ANGIE-01");
    console.log("HU21: Se extrajeron temperatura, humedad y conexion.");
    console.log("HU25: Se identifico el grafico Humedad vs Temperatura.");
    console.log("Metodos utilizados: observe(), act() y extract().");
    console.log(
      "Evidencia generada: evidencias/stagehand-angie-hu21-hu25-monstera.png"
    );
    console.log("==============================================\n");

    await new Promise((resolve) => setTimeout(resolve, 5000));
  } catch (error) {
    console.error("\nERROR EN LA PRUEBA STAGEHAND DE MONSTERA:");
    console.error(error);
    process.exitCode = 1;
  } finally {
    await stagehand.close();
  }
}

ejecutarPrueba();