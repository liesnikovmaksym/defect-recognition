import path from 'node:path';
import { RESULTS, environment, launchBrowser, saveTables, setupBench, startApp, writeJson } from './lib.mjs';

const SUITES = {
  recognition: () => import('./suites/recognition.mjs'),
  parallel: () => import('./suites/parallel.mjs'),
  responsive: () => import('./suites/responsive.mjs'),
  training: () => import('./suites/training.mjs'),
  data: () => import('./suites/data.mjs'),
  robustness: () => import('./suites/robustness.mjs'),
};

const requested = process.argv.slice(2);
const names = requested.length ? requested : Object.keys(SUITES);

const app = await startApp(5330);
const browser = await launchBrowser();

const envPage = await browser.newPage();
await setupBench(envPage, app.url);
writeJson(path.join(RESULTS, 'environment.json'), await environment(browser, envPage));
await envPage.close();

const timing = {};
for (const name of names) {
  const loader = SUITES[name];
  if (!loader) throw new Error(`Невідомий набір: ${name}`);
  const suite = await loader();
  console.log(`\n== ${suite.title} (${name})`);
  const page = await browser.newPage({ viewport: { width: 1000, height: 900 } });
  page.setDefaultTimeout(0);
  await setupBench(page, app.url);
  const started = Date.now();
  const { tables } = await suite.default(page);
  timing[name] = (Date.now() - started) / 1000;
  saveTables(tables);
  await page.close();
  console.log(`   готово за ${timing[name].toFixed(1)} с`);
}

writeJson(path.join(RESULTS, 'timing.json'), timing);
await browser.close();
await app.close();
process.exit(0);
