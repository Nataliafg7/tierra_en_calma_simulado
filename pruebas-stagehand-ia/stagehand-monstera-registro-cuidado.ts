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

    console.log("\n1. Pantalla de Monstera abierta para registrar cuidado.");

    if (!page.url().includes("/monstera")) {
      throw new Error(
        "No fue posible abrir directamente la pantalla de Monstera."
      );
    }

    // ==========================================================
    // Llevar la vista hasta la seccion Registrar Cuidado
    // sin consumir una llamada de IA.
    // ==========================================================
    const formularioVisible = await page.evaluate(() => {
      const encabezados = Array.from(
        document.querySelectorAll("h1, h2, h3, h4")
      );

      const titulo = encabezados.find((elemento) =>
        (elemento.textContent ?? "")
          .toLowerCase()
          .includes("registrar cuidado")
      );

      const seccion =
        titulo?.closest("section") ??
        titulo?.parentElement ??
        document.querySelector(".cuidados-form");

      if (!seccion) {
        return false;
      }

      (seccion as HTMLElement).scrollIntoView({
        behavior: "auto",
        block: "center",
      });

      return true;
    });

    if (!formularioVisible) {
      throw new Error(
        "No se encontro la seccion Registrar Cuidado en la pantalla."
      );
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));

    // ==========================================================
    // OBSERVE - HU23
    // Stagehand reconoce los elementos del formulario.
    // ==========================================================
    const elementosFormulario = await stagehand.observe(
      "Identifica en la seccion Registrar Cuidado el campo Fecha, el selector Tipo de cuidado, el campo Detalles y el boton Guardar cuidado.",
      {
        page,
        timeout: 45000,
      }
    );

    console.log("\n2. Resultado de observe() para HU23:");
    console.log(JSON.stringify(elementosFormulario, null, 2));

    if (elementosFormulario.length < 4) {
      throw new Error(
        "Stagehand no identifico los cuatro elementos del formulario de cuidado."
      );
    }

    // ==========================================================
    // Diligenciar el formulario mediante JavaScript controlado.
    // Esto evita gastar varias solicitudes de Gemini.
    // ==========================================================
    const diligenciamiento = await page.evaluate(() => {
      const encabezados = Array.from(
        document.querySelectorAll("h1, h2, h3, h4")
      );

      const titulo = encabezados.find((elemento) =>
        (elemento.textContent ?? "")
          .toLowerCase()
          .includes("registrar cuidado")
      );

      const raiz =
        titulo?.closest("section") ??
        titulo?.parentElement ??
        document.querySelector(".cuidados-form") ??
        document;

      const fecha = raiz.querySelector(
        'input[type="date"]'
      ) as HTMLInputElement | null;

      const tipo = raiz.querySelector("select") as HTMLSelectElement | null;

      const detalles = raiz.querySelector(
        "textarea"
      ) as HTMLTextAreaElement | null;

      if (!fecha || !tipo || !detalles) {
        return {
          ok: false,
          error: "No se encontraron fecha, tipo o detalles.",
        };
      }

      const opcionPoda = Array.from(tipo.options).find((opcion) =>
        (opcion.textContent ?? "").toLowerCase().includes("poda")
      );

      if (!opcionPoda) {
        return {
          ok: false,
          error: "No se encontro la opcion Poda en el selector.",
        };
      }

      fecha.value = "2026-05-25";
      fecha.dispatchEvent(new Event("input", { bubbles: true }));
      fecha.dispatchEvent(new Event("change", { bubbles: true }));

      tipo.value = opcionPoda.value;
      tipo.dispatchEvent(new Event("input", { bubbles: true }));
      tipo.dispatchEvent(new Event("change", { bubbles: true }));

      detalles.value = "Retiro de hojas secas realizado con Stagehand IA";
      detalles.dispatchEvent(new Event("input", { bubbles: true }));
      detalles.dispatchEvent(new Event("change", { bubbles: true }));

      // Capturar el alert de confirmacion sin usar page.on("dialog"),
      // porque Stagehand v3 no soporta ese evento.
      (window as any).__mensajeStagehand = "";

      window.alert = (mensaje?: unknown) => {
        (window as any).__mensajeStagehand = String(mensaje ?? "");
      };

      return {
        ok: true,
        fecha: fecha.value,
        tipo: opcionPoda.textContent?.trim() ?? "",
        detalles: detalles.value,
      };
    });

    if (!diligenciamiento.ok) {
      throw new Error(
        `No fue posible diligenciar el formulario: ${diligenciamiento.error}`
      );
    }

    console.log("\n3. Formulario diligenciado:");
    console.log(JSON.stringify(diligenciamiento, null, 2));

    mkdirSync("./evidencias", { recursive: true });

    await page.screenshot({
      path: "./evidencias/stagehand-angie-hu23-formulario-diligenciado.png",
      fullPage: true,
    });

    // ==========================================================
    // EXTRACT - HU23
    // Stagehand extrae la informacion visible diligenciada.
    // ==========================================================
    const datosFormulario = await stagehand.extract(
      "Extrae de la seccion Registrar Cuidado el titulo visible, la fecha diligenciada, el tipo de cuidado seleccionado, el detalle escrito y el texto del boton principal.",
      z.object({
        tituloSeccion: z
          .string()
          .describe("Titulo visible de la seccion de cuidados"),
        fecha: z.string().describe("Fecha diligenciada en el formulario"),
        tipoCuidado: z
          .string()
          .describe("Tipo de cuidado seleccionado"),
        detalles: z.string().describe("Texto escrito en detalles"),
        textoBoton: z
          .string()
          .describe("Texto visible del boton principal"),
      }),
      {
        page,
        timeout: 45000,
      }
    );

    console.log("\n4. Resultado de extract() para HU23:");
    console.log(JSON.stringify(datosFormulario, null, 2));

    if (!datosFormulario.tituloSeccion.toLowerCase().includes("cuidado")) {
      throw new Error(
        "No se extrajo correctamente el titulo de la seccion de cuidado."
      );
    }

    if (!datosFormulario.tipoCuidado.toLowerCase().includes("poda")) {
      throw new Error(
        "No se extrajo correctamente el tipo de cuidado Poda."
      );
    }

    if (!datosFormulario.detalles.toLowerCase().includes("hojas secas")) {
      throw new Error(
        "No se extrajo correctamente el detalle diligenciado."
      );
    }

    if (!datosFormulario.textoBoton.toLowerCase().includes("guardar")) {
      throw new Error(
        "No se extrajo correctamente el boton Guardar cuidado."
      );
    }

    // ==========================================================
    // ACT - HU23
    // Stagehand realiza la accion principal del registro.
    // ==========================================================
    const accionGuardar = await stagehand.act(
      "Haz clic en el boton Guardar cuidado de la seccion Registrar Cuidado.",
      {
        page,
        timeout: 45000,
      }
    );

    console.log("\n5. Resultado de act() para HU23:");
    console.log(JSON.stringify(accionGuardar, null, 2));

    if (!accionGuardar.success) {
      throw new Error(
        "Stagehand no logro presionar el boton Guardar cuidado."
      );
    }

    await new Promise((resolve) => setTimeout(resolve, 1500));

    // ==========================================================
    // Recuperar el alert capturado.
    // ==========================================================
    const mensajeAlerta = await page.evaluate(() => {
      return String((window as any).__mensajeStagehand ?? "");
    });

    console.log("\n6. Mensaje capturado despues de guardar:");
    console.log(mensajeAlerta);

    if (!mensajeAlerta.toLowerCase().includes("cuidado")) {
      throw new Error(
        `No se obtuvo confirmacion del cuidado guardado. Mensaje recibido: ${mensajeAlerta}`
      );
    }

    await page.screenshot({
      path: "./evidencias/stagehand-angie-hu23-registro-confirmado.png",
      fullPage: true,
    });

    console.log("\n==============================================");
    console.log("PRUEBA EXITOSA: STAGEHAND-ANGIE-02");
    console.log("HU23: Se registro un cuidado tipo Poda.");
    console.log(`Confirmacion obtenida: ${mensajeAlerta}`);
    console.log("Metodos utilizados: observe(), extract() y act().");
    console.log(
      "Evidencias: stagehand-angie-hu23-formulario-diligenciado.png y stagehand-angie-hu23-registro-confirmado.png"
    );
    console.log("==============================================\n");

    await new Promise((resolve) => setTimeout(resolve, 5000));
  } catch (error) {
    console.error("\nERROR EN LA PRUEBA STAGEHAND DE REGISTRO DE CUIDADO:");
    console.error(error);
    process.exitCode = 1;
  } finally {
    await stagehand.close();
  }
}

ejecutarPrueba();