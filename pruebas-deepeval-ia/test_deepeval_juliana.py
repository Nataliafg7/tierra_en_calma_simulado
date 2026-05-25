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
        raise AssertionError(
            "La consulta de especies no retornó una lista válida."
        )

    nombres = [
        planta["NOMBRE_COMUN"]
        for planta in data
        if "NOMBRE_COMUN" in planta
    ]

    if len(nombres) == 0:
        raise AssertionError(
            "No se encontraron nombres de especies en la respuesta."
        )

    return nombres


def ejecutar_correccion(modelo):
    """
    Corrección - HU3 Inicio de sesión.

    Evalúa si la respuesta real de la API coincide con el contrato
    esperado para credenciales inválidas.
    """
    print("\n======================================================")
    print("DEEPEVAL - PRUEBA DE CORRECCIÓN")
    print("HU3 - INICIO DE SESIÓN CON CREDENCIALES INVÁLIDAS")
    print("======================================================")

    estado, mensaje = obtener_login_invalido()

    actual_output = (
        f"HTTP_STATUS={estado}; "
        f"MESSAGE={mensaje}"
    )

    expected_output = (
        "HTTP_STATUS=401; "
        "MESSAGE=Credenciales inválidas"
    )

    print("\nSalida real evaluada:")
    print(actual_output)

    print("\nSalida esperada:")
    print(expected_output)

    caso = LLMTestCase(
        input=(
            "Validar la respuesta de la API al iniciar sesión "
            "con credenciales inválidas."
        ),
        actual_output=actual_output,
        expected_output=expected_output
    )

    metrica = GEval(
        name="Corrección HU3 - Contrato de respuesta para login inválido",
        evaluation_steps=[
            "Compara únicamente los valores de HTTP_STATUS de actual_output y expected_output.",
            "Compara únicamente los valores de MESSAGE de actual_output y expected_output.",
            "Si HTTP_STATUS coincide exactamente y MESSAGE coincide exactamente, asigna la calificación máxima.",
            "No penalices estilos de redacción, contexto adicional ni explicaciones no incluidas; solo evalúa esos dos valores."
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

    print("\nRESULTADO DEEPEVAL - CORRECCIÓN HU3")
    print(f"Score: {metrica.score}")
    print(f"Razón: {metrica.reason}")

    if metrica.score >= 0.7:
        print(
            "\nPRUEBA EXITOSA: La respuesta real de HU3 coincide "
            "con el contrato esperado para credenciales inválidas."
        )
    else:
        print(
            "\nPRUEBA NO APROBADA: El modelo evaluador no calificó "
            "correctamente una coincidencia exacta del contrato."
        )


def ejecutar_rag(modelo):
    """
    RAG / fidelidad contextual - HU8 Consulta de especies disponibles.

    Se evalúa que la respuesta construida desde GET /api/plantas
    conserve exactamente los nombres devueltos por el catálogo.
    """
    print("\n======================================================")
    print("DEEPEVAL - PRUEBA RAG / FIDELIDAD CONTEXTUAL")
    print("HU8 - CONSULTA DE ESPECIES DISPONIBLES")
    print("======================================================")

    especies = obtener_especies_disponibles()

    if not especies:
        raise AssertionError(
            "La API no devolvió especies disponibles para evaluar la HU8."
        )

    umbral_fidelidad = 0.5

    nombres_literales = ", ".join(
        f'"{nombre}"' for nombre in especies
    )

    retrieval_context = [
        (
            "La API GET /api/plantas devolvió nombres literales registrados "
            "en el catálogo de la aplicación. Estos nombres deben conservarse "
            "exactamente como fueron recibidos, sin traducirse, corregirse ni "
            "reemplazarse por nombres equivalentes en otro idioma. "
            f"Especies disponibles para registrar: {nombres_literales}. "
            'En particular, "Lengua de suegra" es una etiqueta válida del '
            "catálogo y no debe traducirse."
        )
    ]

    actual_output = (
        "Las especies disponibles para registrar, conservando exactamente "
        f"los nombres del catálogo, son: {nombres_literales}."
    )

    caso = LLMTestCase(
        input=(
            "¿Qué especies se encuentran disponibles para registrar? "
            "Responde utilizando exactamente los nombres literales "
            "devueltos por el catálogo, sin traducirlos."
        ),
        actual_output=actual_output,
        retrieval_context=retrieval_context
    )

    metrica = FaithfulnessMetric(
        threshold=umbral_fidelidad,
        model=modelo,
        include_reason=True,
        async_mode=False
    )

    metrica.measure(caso)

    print("\nContexto recuperado desde la API:")
    print(f"- {retrieval_context[0]}")

    print("\nSalida evaluada:")
    print(actual_output)

    print("\nRESULTADO DEEPEVAL - RAG / FIDELIDAD HU8")
    print(f"Score: {metrica.score}")
    print(f"Umbral configurado: {umbral_fidelidad}")
    print(f"Razón: {metrica.reason}")

    if metrica.score >= umbral_fidelidad:
        print(
            "\nPRUEBA EXITOSA: La salida está respaldada por el contexto "
            "recuperado y conserva los nombres literales del catálogo."
        )
    else:
        print(
            "\nPRUEBA NO APROBADA: La salida no alcanzó el umbral "
            "de fidelidad configurado."
        )


def ejecutar_toxicidad(modelo):
    """
    Toxicidad - HU3 Inicio de sesión.

    Evalúa que el mensaje de rechazo presentado al usuario
    ante credenciales inválidas no contenga lenguaje ofensivo,
    agresivo o inapropiado.
    """
    print("\n======================================================")
    print("DEEPEVAL - PRUEBA DE TOXICIDAD")
    print("HU3 - MENSAJE DE CREDENCIALES INVÁLIDAS")
    print("======================================================")

    _, mensaje = obtener_login_invalido()

    umbral_toxicidad = 0.2

    caso = LLMTestCase(
        input=(
            "El usuario intentó iniciar sesión con credenciales inválidas "
            "y el sistema debe informarle el rechazo de forma respetuosa."
        ),
        actual_output=mensaje
    )

    metrica = ToxicityMetric(
        threshold=umbral_toxicidad,
        model=modelo,
        include_reason=True,
        async_mode=False
    )

    metrica.measure(caso)

    print("\nMensaje evaluado:")
    print(mensaje)

    print("\nRESULTADO DEEPEVAL - TOXICIDAD HU3")
    print(f"Score de toxicidad: {metrica.score}")
    print(f"Umbral máximo permitido: {umbral_toxicidad}")
    print(f"Razón: {metrica.reason}")

    if metrica.score <= umbral_toxicidad:
        print(
            "\nPRUEBA EXITOSA: El mensaje evaluado no presenta "
            "toxicidad relevante."
        )
    else:
        print(
            "\nPRUEBA NO APROBADA: El mensaje superó el "
            "umbral de toxicidad permitido."
        )


def main():
    """
    Permite ejecutar cada prueba de forma individual desde la terminal.
    """
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
        print("Opciones disponibles: correccion, rag, toxicidad")
        sys.exit(1)


if __name__ == "__main__":
    main()