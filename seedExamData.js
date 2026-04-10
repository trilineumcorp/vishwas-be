/**
 * Entry point: run from the backend folder:
 *   node seedExamData.js
 *   node seedExamData.js --clear
 *
 * Requires dev dependency ts-node-dev (already used by `npm run dev`).
 */
const path = require('path');
const { spawnSync } = require('child_process');

require('dotenv').config({ path: path.join(__dirname, '.env') });

const result = spawnSync(
  'npx',
  ['ts-node-dev', '--transpile-only', path.join('scripts', 'seed-exam-data.ts'), ...process.argv.slice(2)],
  {
    cwd: __dirname,
    stdio: 'inherit',
    shell: true,
    env: process.env,
  }
);

process.exit(result.status ?? 1);
