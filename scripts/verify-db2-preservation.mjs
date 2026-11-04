import {readFile, writeFile, readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const baseline = JSON.parse(await readFile('verification/db2/baseline.json', 'utf8'));
const changed = [];
for (const file of baseline) {
  const current = createHash('sha256').update(await readFile(file.path)).digest('hex');
  if (current.toUpperCase() !== file.hash) changed.push(file.path);
}
const permitted = ['/.gitignore', '/package.json', '/frontend/package.json', '/frontend/package-lock.json', '/frontend/src/main.jsx', '/frontend/src/features/transposable-elements/routePresentation.js'];
const unexpected = changed.filter(path => !permitted.some(p => path.replaceAll('\\', '/').endsWith(p)));
const assets = (await readdir('frontend/dist/assets')).filter(p => p.endsWith('.js'));
const bundle = (await Promise.all(assets.map(p => readFile(`frontend/dist/assets/${p}`, 'utf8')))).join('\n');
const leaked = /sb_secret_[a-zA-Z0-9_-]{8,}|SUPABASE_SERVICE_ROLE_KEY|commit_learner_batch|foundation_write_disabled/.test(bundle);
const evidence = {baseline_count: baseline.length, unchanged: baseline.length - changed.length, changed, unexpected, privileged_server_code_in_browser_bundle: leaked};
await writeFile('verification/db2/preservation.json', JSON.stringify(evidence, null, 2) + '\n');
console.log(JSON.stringify(evidence, null, 2));
if (unexpected.length || leaked) process.exitCode = 1;
