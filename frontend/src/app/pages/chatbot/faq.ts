export interface Pregunta {
  texto: string;
  respuesta: string;
}

export interface Categoria {
  categoria: string;
  preguntas: Pregunta[];
}


export const FAQS: Categoria[] = [
  {
    categoria: "Cuidado de plantas",
    preguntas: [
      {
        texto: "¿Cada cuánto debo regar mi planta?",
        respuesta: "Depende del tipo de planta y del ambiente. En general, revisa que la capa superior del suelo esté seca antes de regar. En Tierra en Calma puedes ver el nivel de humedad desde los sensores."
      },
      {
        texto: "¿Qué hago si las hojas de mi planta se están poniendo amarillas?",
        respuesta: "Puede deberse a exceso de agua, poca luz o falta de nutrientes. Verifica la humedad y asegúrate de que la planta reciba la luz adecuada."
      },
      {
        texto: "¿Cómo sé si mi planta necesita más luz?",
        respuesta: "Si las hojas pierden color o se inclinan hacia la ventana, probablemente necesita más luz. Puedes verificarlo desde la app con los datos de los sensores."
      }
    ]
  },
  {
    categoria: "Sistema Tierra en Calma",
    preguntas: [
      {
        texto: "¿Cómo funciona el riego automático?",
        respuesta: "Cuando el sensor detecta que la humedad del suelo está por debajo del nivel recomendado, activa la bomba de agua automáticamente hasta alcanzar el valor ideal."
      },
      {
        texto: "¿Dónde puedo ver los datos de mi planta?",
        respuesta: "En la sección Mis Plantas, en el panel principal. Allí podrás ver humedad, temperatura, historial de riegos y gráficos con los valores registrados."
      }
    ]
  },


  
  {
    categoria: "Cuenta y uso de la app",
    preguntas: [
      {
        texto: "¿Cómo puedo registrar una nueva planta?",
        respuesta: "En la sección Agregar Planta, escribe el nombre común, el científico y selecciona el sensor. Luego aparecerá en Mis Plantas."
      },
      {
        texto: "Olvidé mi contraseña, ¿qué hago?",
        respuesta: "Haz clic en '¿Olvidaste tu contraseña?' y recibirás un correo con las instrucciones para restablecerla."
      },
      {
        texto: "¿Puedo ver el historial de riegos?",
        respuesta: "Sí, en cada planta hay una sección de Historial de Riegos con las fechas y la cantidad de agua usada."
      }
    ]
  },
  {
    categoria: "Consejos generales",
    preguntas: [
      {
        texto: "¿Cuál es la mejor hora para regar las plantas?",
        respuesta: "Lo ideal es hacerlo temprano en la mañana o al final de la tarde para evitar que el agua se evapore rápido."
      },
      {
        texto: "¿Puedo usar agua de lluvia para mis plantas?",
        respuesta: "Sí, siempre que no esté contaminada. Es más suave y tiene menos minerales que la del grifo."
      },
      {
        texto: "¿Qué plantas son más resistentes para interiores?",
        respuesta: "🌑 Luz baja: Potus, Lengua de suegra, Dólar Aglaonema.\n 🌤️ Luz media: Monstera, Hoja de violín.\n ☀️ Luz brillante indirecta: Palma Areca."
      }
    ]
  },
  
  {
    categoria: "Guía de plantas disponibles",
    preguntas: [
      {
        texto: "¿Cómo cuido mi Potus?",
        respuesta: `🌿 Potus (Epipremnum aureum)
Luz: Indirecta, tolera poca iluminación.
Temperatura: 15–30 °C
Humedad ideal: 60 %
Riego: Moderado, evita encharcar.
Poda: Cada 2–3 meses para estimular crecimiento y controlar tamaño.
Fertilización: Cada 30 días con abono líquido diluido.
Consejo: Limpia las hojas con un paño húmedo para mejorar su respiración.`
      },
      {
        texto: "¿Cómo cuido mi Lengua de suegra?",
        respuesta: `🌱 Lengua de suegra (Sansevieria trifasciata)
Luz: Poca o media, muy adaptable.
Temperatura: 12–28 °C
Humedad ideal: 40 %
Riego: Cada 15–20 días.
Poda: Solo cuando las hojas se secan o dañan.
Fertilización: Cada 90 días, preferiblemente en primavera o verano.
Consejo: Ideal para principiantes, muy resistente.`
      },
      {
        texto: "¿Cómo cuido mi Palma Areca?",
        respuesta: `🌴 Palma Areca (Dypsis lutescens)
Luz: Indirecta y buena ventilación.
Temperatura: 16–27 °C
Humedad ideal: 65 %
Riego: Moderado, mantener la tierra húmeda sin encharcar.
Poda: Cada 2 meses, eliminando hojas secas.
Fertilización: Cada 30 días con abono rico en nitrógeno.
Consejo: Pulveriza sus hojas con agua para conservar la humedad.`
      },
      {
        texto: "¿Cómo cuido mi Dólar Aglaonema?",
        respuesta: `🍃 Dólar Aglaonema (Aglaonema spp.)
Luz: Tolera poca luz.
Temperatura: 18–26 °C
Humedad ideal: 55 %
Riego: Moderado, evitando exceso de agua.
Poda: Cada 3 meses, cortando hojas viejas o dañadas.
Fertilización: Cada 60 días con abono balanceado.
Consejo: Perfecta para oficinas, evita corrientes de aire frío.`
      },
      {
        texto: "¿Cómo cuido mi Hoja de violín?",
        respuesta: `🌿 Hoja de violín (Ficus lyrata)
Luz: Brillante indirecta.
Temperatura: 18–27 °C
Humedad ideal: 60 %
Riego: Moderado, mantener el sustrato húmedo sin exceso.
Poda: Cada 2 meses para mantener la forma.
Fertilización: Cada 45 días con abono orgánico o líquido suave.
Consejo: No cambies de lugar con frecuencia, se estresa fácilmente.`
      },
      {
        texto: "¿Cómo cuido mi Monstera?",
        respuesta: `🌿 Monstera (Monstera deliciosa)
Luz: Indirecta brillante.
Temperatura: 18–30 °C
Humedad ideal: 70 %
Riego: Cada 7–10 días.
Poda: Cada 3 meses o cuando haya hojas secas.
Fertilización: Cada 30 días con abono líquido.
Consejo: Coloca un tutor o soporte para ayudar a sus raíces aéreas.`
      }
    ]
  }

  
];
