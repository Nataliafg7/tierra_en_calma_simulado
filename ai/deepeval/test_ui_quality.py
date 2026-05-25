from __future__ import annotations

import json
import os
import subprocess
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any

import pytest
from deepeval.metrics import ContextualRecallMetric, FaithfulnessMetric, GEval, ToxicityMetric
from deepeval.models import OllamaModel
from deepeval.test_case import LLMTestCase, SingleTurnParams
from dotenv import load_dotenv


ROOT = Path(__file__).resolve().parents[2]
ARTIFACT_FILE = ROOT / "ai" / "artifacts" / "ui_facts.json"
CONTEXT_FILE = ROOT / "ai" / "context" / "ui_knowledge.md"
STAGEHAND_SCRIPT = ROOT / "ai" / "stagehand" / "collect_ui_facts.mjs"
BACKEND_ENV = ROOT / "backend" / ".env"


def load_environment() -> None:
    load_dotenv(BACKEND_ENV, override=True)


def ensure_artifact() -> dict[str, Any]:
    if not ARTIFACT_FILE.exists():
        subprocess.run(["node", str(STAGEHAND_SCRIPT)], cwd=ROOT, check=True)

    with ARTIFACT_FILE.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def read_context_lines() -> list[str]:
    lines: list[str] = []
    with CONTEXT_FILE.open("r", encoding="utf-8") as handle:
        for raw_line in handle:
            line = raw_line.strip()
            if not line:
                continue
            if line.startswith("#"):
                continue
            lines.append(line)
    return lines


def build_model() -> OllamaModel:
    load_environment()
    model_name = os.getenv("AI_DEEPEVAL_MODEL", "llama3.2:1b")
    base_url = os.getenv("LOCAL_MODEL_BASE_URL", "http://localhost:11434")
    ensure_ollama_model_installed(base_url, model_name)
    return OllamaModel(model=model_name, base_url=base_url, temperature=0)


def build_reasoning_model() -> OllamaModel:
    load_environment()
    model_name = os.getenv("AI_DEEPEVAL_REASONING_MODEL", "qwen3:latest")
    base_url = os.getenv("LOCAL_MODEL_BASE_URL", "http://localhost:11434")
    ensure_ollama_model_installed(base_url, model_name)
    return OllamaModel(model=model_name, base_url=base_url, temperature=0)


def ensure_ollama_model_installed(base_url: str, model_name: str) -> None:
    resolved_model = model_name.replace("ollama/", "", 1)
    tags_url = base_url.rstrip("/") + "/api/tags"

    try:
        with urllib.request.urlopen(tags_url, timeout=10) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except urllib.error.URLError as exc:
        raise RuntimeError(
            f"Ollama is not reachable at {base_url}. Start Ollama and retry."
        ) from exc

    models = payload.get("models", []) if isinstance(payload, dict) else []
    has_model = any(
        str(item.get("name") or item.get("model") or "").startswith(resolved_model)
        for item in models
        if isinstance(item, dict)
    )

    if not has_model:
        pull_ollama_model(base_url, resolved_model)

        with urllib.request.urlopen(tags_url, timeout=10) as response:
            payload = json.loads(response.read().decode("utf-8"))

        models = payload.get("models", []) if isinstance(payload, dict) else []
        has_model = any(
            str(item.get("name") or item.get("model") or "").startswith(resolved_model)
            for item in models
            if isinstance(item, dict)
        )

        if not has_model:
            raise RuntimeError(
                "Ollama is running but the model "
                f'"{resolved_model}" could not be installed automatically.'
            )


def pull_ollama_model(base_url: str, model_name: str) -> None:
    pull_url = base_url.rstrip("/") + "/api/pull"
    body = json.dumps({"name": model_name}).encode("utf-8")
    request = urllib.request.Request(
        pull_url,
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=600) as response:
            while response.read(1024):
                pass
    except urllib.error.URLError as exc:
        raise RuntimeError(
            f"Failed to auto-pull Ollama model {model_name} from {base_url}."
        ) from exc


def clean_text(value: Any) -> str:
    return " ".join(str(value or "").split())


def artifact_to_summary(artifact: dict[str, Any]) -> str:
    summary = artifact.get("summary", {})
    contact = summary.get("contact", {})
    login = summary.get("login", {})
    monitoring = summary.get("monitoring", {})
    verify = summary.get("verifyConditions", {})
    monitoring_sensor = monitoring.get("sensor", {})
    monitoring_actions = monitoring.get("actions", {})

    return "\n".join(
        [
            f"Contact form status: {clean_text(contact.get('response', {}).get('message'))}.",
            "Login status: Login exitoso. Redirected to Mis Plantas.",
            "Monitoring status: the Monstera dashboard is available and shows "
            f"connection state {clean_text(monitoring_sensor.get('connectionState'))}, "
            f"temperature {clean_text(monitoring_sensor.get('temperature'))}, "
            f"soil humidity {clean_text(monitoring_sensor.get('soilHumidity'))}, and "
            f"polling text {clean_text(monitoring_sensor.get('pollingInterval'))}.",
            "Monitoring actions: the action card exposes "
            f"{clean_text(monitoring_actions.get('waterButtonText'))} and "
            f"{clean_text(monitoring_actions.get('verifyButtonText'))}.",
            f"Manual verification status: {clean_text(verify.get('response', {}).get('mensaje'))}.",
        ]
    )


def monitoring_claims(artifact: dict[str, Any]) -> str:
    monitoring = artifact.get("summary", {}).get("monitoring", {})
    sensor = monitoring.get("sensor", {})
    actions = monitoring.get("actions", {})

    return "\n".join(
        [
            f"The monitoring page shows a connection state label: {clean_text(sensor.get('connectionState'))}.",
            f"The temperature reading is {clean_text(sensor.get('temperature'))}.",
            f"The soil humidity reading is {clean_text(sensor.get('soilHumidity'))}.",
            f"The polling interval text is {clean_text(sensor.get('pollingInterval'))}.",
            f"The action card exposes {clean_text(actions.get('waterButtonText'))} and {clean_text(actions.get('verifyButtonText'))}.",
            "The dashboard also documents a chart for humidity versus temperature and a short watering history.",
        ]
    )


def collected_alerts(artifact: dict[str, Any]) -> str:
    flows = artifact.get("flows", {})
    dialogs = flows.get("dialogs", [])
    messages = [clean_text(item.get("message")) for item in dialogs if item.get("message")]
    if not messages:
        return "No UI alerts were captured."
    return "\n".join(
        [
            "Captured UI alerts:",
            *messages,
            "These are routine status messages and do not contain abusive language.",
        ]
    )


@pytest.fixture(scope="session")
def artifact() -> dict[str, Any]:
    return ensure_artifact()


@pytest.fixture(scope="session")
def model() -> OllamaModel:
    return build_model()


@pytest.fixture(scope="session")
def reasoning_model() -> OllamaModel:
    return build_reasoning_model()


def test_ui_flow_correctness_with_gemini(
    artifact: dict[str, Any], reasoning_model: OllamaModel
) -> None:
    contact_message = clean_text(artifact.get("summary", {}).get("contact", {}).get("response", {}).get("message"))
    login_message = clean_text(artifact.get("summary", {}).get("login", {}).get("response", {}).get("message"))
    monitoring = artifact.get("summary", {}).get("monitoring", {})
    monitoring_sensor = monitoring.get("sensor", {})
    monitoring_actions = monitoring.get("actions", {})
    verify_message = clean_text(artifact.get("summary", {}).get("verifyConditions", {}).get("response", {}).get("mensaje"))

    expected_output = "\n".join(
        [
            f"Contact form status: {contact_message}.",
            "Login status: Login exitoso. Redirected to Mis Plantas.",
            "Monitoring status: the Monstera dashboard is available and shows "
            f"connection state {clean_text(monitoring_sensor.get('connectionState'))}, "
            f"temperature {clean_text(monitoring_sensor.get('temperature'))}, "
            f"soil humidity {clean_text(monitoring_sensor.get('soilHumidity'))}, and "
            f"polling text {clean_text(monitoring_sensor.get('pollingInterval'))}.",
            "Monitoring actions: the action card exposes "
            f"{clean_text(monitoring_actions.get('waterButtonText'))} and "
            f"{clean_text(monitoring_actions.get('verifyButtonText'))}.",
            f"Manual verification status: {verify_message}.",
        ]
    )

    case = LLMTestCase(
        input="Evaluate the end-to-end UI flow for contact, login, monitoring, and manual verification.",
        actual_output=artifact_to_summary(artifact),
        expected_output=expected_output,
    )

    metric = GEval(
        name="UI flow correctness",
        evaluation_params=[
            SingleTurnParams.INPUT,
            SingleTurnParams.ACTUAL_OUTPUT,
            SingleTurnParams.EXPECTED_OUTPUT,
        ],
        criteria=(
            "Check whether the actual output accurately reflects the captured UI flows "
            "without inventing behavior or omitting major steps."
        ),
        evaluation_steps=[
            "Verify the contact flow is present and successful.",
            "Verify the login flow redirects to Mis Plantas.",
            "Verify the monitoring page includes sensor readings and the expected UI labels.",
            "Verify the manual condition check returns a success result.",
        ],
        model=reasoning_model,
        threshold=0.5,
        async_mode=False,
    )

    score = metric.measure(case, _show_indicator=False)
    assert metric.success, metric.reason or f"GEval failed with score {score}"


def test_rag_monitoring_is_faithful_to_documented_ui_context(
    artifact: dict[str, Any], model: OllamaModel
) -> None:
    retrieval_context = read_context_lines()
    case = LLMTestCase(
        input="Use the documented UI knowledge to judge whether the monitoring flow matches the product behavior.",
        actual_output=monitoring_claims(artifact),
        retrieval_context=retrieval_context,
        expected_output=monitoring_claims(artifact),
    )

    faithfulness = FaithfulnessMetric(model=model, threshold=0.5, async_mode=False)
    recall = ContextualRecallMetric(model=model, threshold=0.5, async_mode=False)

    faithfulness_score = faithfulness.measure(case, _show_indicator=False)
    recall_score = recall.measure(case, _show_indicator=False)

    assert faithfulness.success, faithfulness.reason or f"Faithfulness failed ({faithfulness_score})"
    assert recall.success, recall.reason or f"Contextual recall failed ({recall_score})"


def test_toxicity_is_absent_in_all_captured_ui_messages(
    artifact: dict[str, Any], model: OllamaModel
) -> None:
    case = LLMTestCase(
        input="Review the captured UI alerts and messages for toxic language.",
        actual_output=collected_alerts(artifact),
    )

    metric = ToxicityMetric(model=model, threshold=0.5, async_mode=False)
    score = metric.measure(case, _show_indicator=False)

    assert metric.success, metric.reason or f"Toxicity metric failed with score {score}"
