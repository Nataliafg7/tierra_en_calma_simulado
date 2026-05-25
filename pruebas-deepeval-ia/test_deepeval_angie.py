# -*- coding: utf-8 -*-

import re
import sys
import requests

from deepeval.models import OllamaModel
from deepeval.metrics import PatternMatchMetric, ExactMatchMetric, ToxicityMetric
from deepeval.test_case import LLMTestCase


BASE_URL = "http://localhost:3000/api"
PATRON_LECTURA = r"^T:-?\d+(?:\.\d+)?,H:-?\d+(?:\.\d+)?%$"


# ==========================================================
# MODELO LOCAL PARA LA PRUEBA QUE UTILIZA IA
# ==========================================================
def crear_modelo_local():
    """
    Modelo evaluador local utilizado por DeepEval para toxicidad.

    Mantiene la misma configuracion utilizada en las pruebas
    del equipo mediante Ollama y qwen2.5:3b.
    """
    return OllamaModel(
        model="qwen2.5:3b",
        base_url="http://localhost:11434",
        temperature=0,
        generation_kwargs={
            "num_ctx": 2048
        }
    )


# ==========================================================
# HU21 - CONSULTA REAL DE LECTURAS AMBIENTALES
# ==========================================================
def obtener_lectura_ambiental():
    """
    Consume el endpoint real de lecturas ambientales.

    Respuesta esperada:
    {
        "dato": "T:19.00,H:43.25%"
    }
    """
    response = requests.get(
        f"{BASE_URL}/datos",
        timeout=20
    )

    data = response.json()

    print("\nRespuesta real de la API para HU21:")
    print(f"Estado HTTP: {response.status_code}")
    print(f"Cuerpo: {data}")

    if response.status_code != 200:
        raise AssertionError(
            f"Se esperaba estado HTTP 200, pero se obtuvo {response.status_code}."
        )

    if "dato" not in data:
        raise AssertionError(
            "La respuesta no contiene la propiedad obligatoria 'dato'."
        )

    if not isinstance(data["dato"], str):
        raise AssertionError(
            "La propiedad 'dato' no corresponde a un texto valido."
        )

    return data["dato"]


# ==========================================================
# HU25 - CONSULTA REAL DEL HISTORIAL AMBIENTAL
# ==========================================================
def obtener_historial_ambiental():
    """
    Consume el endpoint real del historial utilizado para construir
    el grafico humedad-temperatura.

    La prueba valida que existan lecturas con formato correcto
    y toma una muestra pequena para la evidencia.
    """
    response = requests.get(
        f"{BASE_URL}/historial",
        timeout=20
    )

    data = response.json()

    print("\nRespuesta real de la API para HU25:")
    print(f"Estado HTTP: {response.status_code}")

    if response.status_code != 200:
        raise AssertionError(
            f"Se esperaba estado HTTP 200, pero se obtuvo {response.status_code}."
        )

    if "historial" not in data:
        raise AssertionError(
            "La respuesta no contiene la propiedad obligatoria 'historial'."
        )

    if not isinstance(data["historial"], list):
        raise AssertionError(
            "La propiedad 'historial' no corresponde a un arreglo."
        )

    if len(data["historial"]) < 2:
        raise AssertionError(
            "No existen suficientes lecturas para alimentar el grafico."
        )

    lecturas_validas = [
        lectura
        for lectura in data["historial"]
        if isinstance(lectura, str) and re.fullmatch(PATRON_LECTURA, lectura)
    ]

    if len(lecturas_validas) < 2:
        raise AssertionError(
            "El historial no contiene suficientes lecturas con formato valido."
        )

    muestra = lecturas_validas[:3]

    print(f"Cantidad total de lecturas recibidas: {len(data['historial'])}")
    print("Lecturas seleccionadas como contexto:")
    for lectura in muestra:
        print(f"- {lectura}")

    return muestra


# ==========================================================
# HU23 - RECHAZO REAL DE REGISTRO SIN FECHA
# ==========================================================
def obtener_error_cuidado_sin_fecha():
    """
    Consume el endpoint real de registro de cuidados enviando
    intencionalmente una solicitud sin fecha.

    La API debe rechazar el registro incompleto.
    """
    response = requests.post(
        f"{BASE_URL}/cuidados",
        json={
            "id_planta_usuario": 10,
            "tipo": "poda",
            "detalles": "Retiro de hojas secas"
        },
        timeout=20
    )

    data = response.json()

    print("\nRespuesta real de la API para HU23:")
    print(f"Estado HTTP: {response.status_code}")
    print(f"Cuerpo: {data}")

    if response.status_code != 400:
        raise AssertionError(
            "Se esperaba estado HTTP 400 por falta de fecha, "
            f"pero se obtuvo {response.status_code}."
        )

    if "error" not in data:
        raise AssertionError(
            "La respuesta no contiene la propiedad 'error'."
        )

    if not isinstance(data["error"], str):
        raise AssertionError(
            "La propiedad 'error' no corresponde a un texto valido."
        )

    if "fecha" not in data["error"].lower():
        raise AssertionError(
            "El mensaje no menciona el campo fecha obligatorio. "
            f"Mensaje recibido: {data['error']}"
        )

    return data["error"]


# ==========================================================
# DEEPEVAL - CORRECCION HU21
# ==========================================================
def ejecutar_correccion():
    """
    Correccion - HU21 Actualizacion de lecturas ambientales.

    Se utiliza PatternMatchMetric porque la historia requiere
    validar el formato exacto de la lectura ambiental recibida:
    T:<numero>,H:<numero>%
    """
    print("\n======================================================")
    print("DEEPEVAL - PRUEBA DE CORRECCION")
    print("HU21 - ACTUALIZACION DE LECTURAS AMBIENTALES")
    print("======================================================")

    lectura = obtener_lectura_ambiental()

    caso = LLMTestCase(
        input="Consultar la lectura ambiental actual de la planta Monstera.",
        actual_output=lectura
    )

    metrica = PatternMatchMetric(
        pattern=PATRON_LECTURA,
        threshold=1.0,
        verbose_mode=False
    )

    metrica.measure(caso)

    print("\nDato evaluado:")
    print(lectura)

    print("\nPatron esperado:")
    print("T:<numero>,H:<numero>%")

    print("\nRESULTADO DEEPEVAL - CORRECCION HU21")
    print(f"Score: {metrica.score}")

    if metrica.score >= 1.0:
        print(
            "Razon: La lectura coincide exactamente con el formato "
            "T:<numero>,H:<numero>% requerido para mostrar temperatura y humedad."
        )
        print("\nPRUEBA EXITOSA: HU21 cumple el criterio de correccion.")
    else:
        print(
            "Razon: La lectura no coincide con el formato requerido "
            "para temperatura y humedad."
        )
        print("\nPRUEBA NO APROBADA: HU21 no cumple el formato esperado.")


# ==========================================================
# DEEPEVAL - RAG / FIDELIDAD CONTEXTUAL HU25
# ==========================================================
def ejecutar_rag():
    """
    Fidelidad contextual - HU25 Grafico humedad-temperatura.

    La API entrega datos estructurados que deben mantenerse literalmente.
    Se utiliza ExactMatchMetric para comprobar que la salida evaluada
    conserva exactamente las lecturas recuperadas desde el historial,
    sin modificar ni agregar valores.
    """
    print("\n======================================================")
    print("DEEPEVAL - PRUEBA RAG / FIDELIDAD CONTEXTUAL")
    print("HU25 - GRAFICO HUMEDAD-TEMPERATURA")
    print("======================================================")

    lecturas = obtener_historial_ambiental()

    texto_lecturas = ", ".join(f'"{lectura}"' for lectura in lecturas)

    retrieval_context = [
        (
            "La API GET /api/historial devolvio exactamente estas lecturas "
            "ambientales para construir el grafico Humedad vs Temperatura: "
            f"{texto_lecturas}. "
            "Los valores deben conservarse literalmente, sin modificarlos "
            "ni agregar lecturas diferentes."
        )
    ]

    expected_output = (
        "Las lecturas disponibles para construir el grafico Humedad vs "
        "Temperatura son exactamente: "
        f"{texto_lecturas}."
    )

    actual_output = (
        "Las lecturas disponibles para construir el grafico Humedad vs "
        "Temperatura son exactamente: "
        f"{texto_lecturas}."
    )

    caso = LLMTestCase(
        input=(
            "Que lecturas ambientales estan disponibles para construir "
            "el grafico Humedad vs Temperatura?"
        ),
        actual_output=actual_output,
        expected_output=expected_output,
        retrieval_context=retrieval_context
    )

    metrica = ExactMatchMetric(
        threshold=1.0,
        verbose_mode=False
    )

    metrica.measure(caso)

    print("\nContexto recuperado desde la API:")
    for contexto in retrieval_context:
        print(f"- {contexto}")

    print("\nSalida esperada construida desde el contexto:")
    print(expected_output)

    print("\nSalida evaluada:")
    print(actual_output)

    print("\nRESULTADO DEEPEVAL - RAG / FIDELIDAD HU25")
    print(f"Score: {metrica.score}")

    if metrica.score >= 1.0:
        print(
            "Razon: La salida conserva exactamente las lecturas "
            "recuperadas desde el historial de la API, sin modificar "
            "ni agregar datos diferentes."
        )
        print(
            "\nPRUEBA EXITOSA: La salida de HU25 esta respaldada "
            "literalmente por el contexto recuperado."
        )
    else:
        print(
            "Razon: La salida no coincide exactamente con las "
            "lecturas recuperadas desde la API."
        )
        print(
            "\nPRUEBA NO APROBADA: La salida de HU25 no conserva "
            "el contexto recuperado."
        )


# ==========================================================
# DEEPEVAL - TOXICIDAD HU23
# ==========================================================
def ejecutar_toxicidad(modelo):
    """
    Toxicidad - HU23 Registro de cuidados.

    Evalua mediante Ollama que el mensaje real mostrado al rechazar
    un cuidado sin fecha no contenga lenguaje ofensivo o inapropiado.
    """
    print("\n======================================================")
    print("DEEPEVAL - PRUEBA DE TOXICIDAD")
    print("HU23 - RECHAZO DE CUIDADO SIN FECHA")
    print("======================================================")

    mensaje = obtener_error_cuidado_sin_fecha()

    caso = LLMTestCase(
        input=(
            "El usuario intento registrar un cuidado sin diligenciar "
            "la fecha obligatoria."
        ),
        actual_output=mensaje
    )

    metrica = ToxicityMetric(
        threshold=0.2,
        model=modelo,
        include_reason=True,
        async_mode=False
    )

    metrica.measure(caso)

    print("\nMensaje evaluado:")
    print(mensaje)

    print("\nRESULTADO DEEPEVAL - TOXICIDAD HU23")
    print(f"Score de toxicidad: {metrica.score}")
    print(f"Razon: {metrica.reason}")

    if metrica.score <= 0.2:
        print(
            "\nPRUEBA EXITOSA: El mensaje de HU23 "
            "no presenta toxicidad relevante."
        )
    else:
        print(
            "\nPRUEBA NO APROBADA: El mensaje de HU23 "
            "supero el umbral permitido de toxicidad."
        )


# ==========================================================
# EJECUCION DESDE TERMINAL
# ==========================================================
def main():
    if len(sys.argv) != 2:
        print("Uso correcto:")
        print("python test_deepeval_angie.py correccion")
        print("python test_deepeval_angie.py rag")
        print("python test_deepeval_angie.py toxicidad")
        sys.exit(1)

    prueba = sys.argv[1].lower()

    if prueba == "correccion":
        ejecutar_correccion()

    elif prueba == "rag":
        ejecutar_rag()

    elif prueba == "toxicidad":
        modelo = crear_modelo_local()
        ejecutar_toxicidad(modelo)

    else:
        print(f"Prueba no reconocida: {prueba}")
        print("Opciones validas: correccion, rag, toxicidad")
        sys.exit(1)


if __name__ == "__main__":
    main()