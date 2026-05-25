import sys
import requests

from deepeval.models import OllamaModel
from deepeval.metrics import GEval, FaithfulnessMetric, ToxicityMetric
from deepeval.test_case import LLMTestCase, SingleTurnParams


BASE_URL = "http://localhost:3000/api"


def crear_modelo_local():
    """
    Modelo evaluador local utilizado por DeepEval.
    No requiere API Key ni consume tokens de Gemini.
    """
    return OllamaModel(
        model="qwen2.5:3b",
        base_url="http://localhost:11434",
        temperature=0,
        generation_kwargs={
            "num_ctx": 2048
        }
    )


def obtener_login_invalido():
    """
    Consume la funcionalidad real de HU3:
    inicio de sesión con credenciales inválidas.
    """
    response = requests.post(
        f"{BASE_URL}/login",
        json={
            "correo_electronico": "usuario_inexistente@gmail.com",
            "contrasena": "ClaveIncorrecta123"
        },
        timeout=20
    )

    data = response.json()

    print("\nRespuesta real de la API:")
    print(f"Estado HTTP: {response.status_code}")
    print(f"Cuerpo: {data}")

    if response.status_code != 401:
        raise AssertionError(
            f"Se esperaba estado 401, pero se obtuvo {response.status_code}."
        )

    if data.get("message") != "Credenciales inválidas":
        raise AssertionError(
            f"Se esperaba el mensaje 'Credenciales inválidas', pero se obtuvo: {data}"
        )

    return response.status_code, data["message"]


def obtener_especies_disponibles():
    """
    Consume la funcionalidad real de HU8:
    consulta de especies disponibles.
    """
    response = requests.get(
        f"{BASE_URL}/plantas",
        timeout=20
    )

    data = response.json()

    print("\nRespuesta real del catálogo:")
    print(f"Estado HTTP: {response.status_code}")
    print(f"Cantidad de especies: {len(data) if isinstance(data, list) else 0}")

    if response.status_code != 200:
        raise AssertionError(
            f"Se esperaba estado 200, pero se obtuvo {response.status_code}."
        )

    if not isinstance(data, list) or len(data) == 0:
        raise AssertionError("La consulta de especies no retornó una lista válida.")

    nombres = [
        planta["NOMBRE_COMUN"]
        for planta in data
        if "NOMBRE_COMUN" in planta
    ]

    if len(nombres) == 0:
        raise AssertionError("No se encontraron nombres de especies en la respuesta.")

    return nombres


def ejecutar_correccion(modelo):
    """
    Corrección - HU3 Inicio de sesión.
    Evalúa si el mensaje real de credenciales inválidas corresponde
    con el comportamiento esperado de la historia de usuario.
    """
    print("\n======================================================")
    print("DEEPEVAL - PRUEBA DE CORRECCIÓN")
    print("HU3 - INICIO DE SESIÓN CON CREDENCIALES INVÁLIDAS")
    print("======================================================")

    estado, mensaje = obtener_login_invalido()

    actual_output = (
        f"El sistema rechazó el acceso con estado HTTP {estado} "
        f"y mostró el mensaje: '{mensaje}'."
    )

    expected_output = (
        "Cuando el usuario ingresa credenciales inválidas, el sistema debe "
        "rechazar el acceso con estado HTTP 401 y mostrar el mensaje "
        "'Credenciales inválidas'."
    )

    caso = LLMTestCase(
        input="Iniciar sesión con credenciales inválidas.",
        actual_output=actual_output,
        expected_output=expected_output
    )

    metrica = GEval(
        name="Corrección HU3 - Rechazo de credenciales inválidas",
        evaluation_steps=[
            "Comprueba si la salida real indica que el acceso fue rechazado.",
            "Comprueba si la salida real contiene el estado HTTP 401.",
            "Comprueba si la salida real incluye exactamente el mensaje 'Credenciales inválidas'.",
            "Asigna una calificación alta únicamente si los tres elementos coinciden con la salida esperada."
        ],
        evaluation_params=[
            SingleTurnParams.ACTUAL_OUTPUT,
            SingleTurnParams.EXPECTED_OUTPUT
        ],
        threshold=0.7,
        model=modelo,
        async_mode=False
    )

    metrica.measure(caso)

    print("\nSalida evaluada:")
    print(actual_output)

    print("\nRESULTADO DEEPEVAL - CORRECCIÓN HU3")
    print(f"Score: {metrica.score}")
    print(f"Razón: {metrica.reason}")

    if metrica.score >= 0.7:
        print("\nPRUEBA EXITOSA: La respuesta de HU3 cumple el criterio de corrección.")
    else:
        print("\nPRUEBA NO APROBADA: La respuesta de HU3 no alcanzó el umbral definido.")


def ejecutar_rag(modelo):
    """
    RAG / fidelidad contextual - HU8 Consulta de especies disponibles.

    La aplicación no implementa un chatbot RAG generativo.
    Para cumplir la evaluación solicitada, se evalúa si la salida
    textual construida desde la consulta se mantiene fiel al contexto
    recuperado desde GET /api/plantas.
    """
    print("\n======================================================")
    print("DEEPEVAL - PRUEBA RAG / FIDELIDAD CONTEXTUAL")
    print("HU8 - CONSULTA DE ESPECIES DISPONIBLES")
    print("======================================================")

    especies = obtener_especies_disponibles()

    retrieval_context = [
        f"Especie disponible para registrar: {nombre}."
        for nombre in especies
    ]

    actual_output = (
        "Las especies disponibles para registrar son: "
        + ", ".join(especies)
        + "."
    )

    caso = LLMTestCase(
        input="¿Qué especies se encuentran disponibles para registrar?",
        actual_output=actual_output,
        retrieval_context=retrieval_context
    )

    metrica = FaithfulnessMetric(
        threshold=0.7,
        model=modelo,
        include_reason=True,
        async_mode=False
    )

    metrica.measure(caso)

    print("\nContexto recuperado desde la API:")
    for item in retrieval_context:
        print(f"- {item}")

    print("\nSalida evaluada:")
    print(actual_output)

    print("\nRESULTADO DEEPEVAL - RAG / FIDELIDAD HU8")
    print(f"Score: {metrica.score}")
    print(f"Razón: {metrica.reason}")

    if metrica.score >= 0.7:
        print("\nPRUEBA EXITOSA: La salida está respaldada por el contexto recuperado.")
    else:
        print("\nPRUEBA NO APROBADA: La salida no alcanzó el umbral de fidelidad.")


def ejecutar_toxicidad(modelo):
    """
    Toxicidad - HU3 Inicio de sesión.
    Evalúa que el mensaje de rechazo presentado al usuario
    no contenga lenguaje ofensivo o inapropiado.
    """
    print("\n======================================================")
    print("DEEPEVAL - PRUEBA DE TOXICIDAD")
    print("HU3 - MENSAJE DE CREDENCIALES INVÁLIDAS")
    print("======================================================")

    _, mensaje = obtener_login_invalido()

    caso = LLMTestCase(
        input="El usuario intentó iniciar sesión con credenciales inválidas.",
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

    print("\nRESULTADO DEEPEVAL - TOXICIDAD HU3")
    print(f"Score de toxicidad: {metrica.score}")
    print(f"Razón: {metrica.reason}")

    if metrica.score <= 0.2:
        print("\nPRUEBA EXITOSA: El mensaje evaluado no presenta toxicidad relevante.")
    else:
        print("\nPRUEBA NO APROBADA: El mensaje superó el umbral de toxicidad.")


def main():
    if len(sys.argv) != 2:
        print("Uso correcto:")
        print("python test_deepeval_juliana.py correccion")
        print("python test_deepeval_juliana.py rag")
        print("python test_deepeval_juliana.py toxicidad")
        sys.exit(1)

    prueba = sys.argv[1].lower()
    modelo = crear_modelo_local()

    if prueba == "correccion":
        ejecutar_correccion(modelo)
    elif prueba == "rag":
        ejecutar_rag(modelo)
    elif prueba == "toxicidad":
        ejecutar_toxicidad(modelo)
    else:
        print(f"Prueba no reconocida: {prueba}")
        sys.exit(1)


if __name__ == "__main__":
    main()