# AI test layer

This folder adds an AI validation layer on top of the existing Cypress suite.

## What it does

- `Stagehand` browses the real UI and collects structured facts from the main flows.
- `DeepEval` evaluates those facts with a local Ollama model using:
  - correctness
  - RAG-style faithfulness and recall
  - toxicity

## How to run

```bash
npm run ai:stagehand
npm run ai:deepeval
npm run ai:test
```

## Requirements

- The frontend must be available at `http://localhost:4200` or the URL provided through `AI_UI_BASE_URL`.
- Ollama must be installed and running locally at `http://localhost:11434`.
- Google Chrome must be installed, or `CHROME_PATH` must point to the executable, when running Stagehand in local mode.

## Free local mode

- Set `STAGEHAND_BROWSER_TARGET=local`.
- Keep `AI_UI_BASE_URL=http://localhost:4200` if your frontend runs locally.
- Use `AI_STAGEHAND_MODEL=ollama/llama3.2:latest`.
- Use `AI_DEEPEVAL_MODEL=llama3.2:latest`.

## Optional Browserbase mode

If you later want to use Browserbase instead of local Chrome, switch `STAGEHAND_BROWSER_TARGET=browserbase` and point `AI_UI_BASE_URL` to a public or tunneled URL. Browserbase cannot reach `localhost`.

## Output

- Stagehand writes `ai/artifacts/ui_facts.json`.
- DeepEval reads that artifact and prints the metric results.
