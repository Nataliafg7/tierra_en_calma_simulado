import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', '..');
const venvPython = path.join(root, '.venv', 'Scripts', 'python.exe');
const pythonExe = fs.existsSync(venvPython) ? venvPython : 'python';
const env = { ...process.env };

if (!env.DEEPEVAL_PER_ATTEMPT_TIMEOUT_SECONDS_OVERRIDE) {
  env.DEEPEVAL_PER_ATTEMPT_TIMEOUT_SECONDS_OVERRIDE = '180';
}
env.POSTHOG_DISABLED = env.POSTHOG_DISABLED || '1';
env.DEEPEVAL_DISABLE_TRACKING = env.DEEPEVAL_DISABLE_TRACKING || '1';

const result = spawnSync(pythonExe, ['-m', 'pytest', 'ai/deepeval/test_ui_quality.py', '-q'], {
  cwd: root,
  env,
  stdio: 'inherit',
});

if (result.error) {
  console.error(result.error);
  process.exit(1);
}

process.exit(result.status ?? 1);
