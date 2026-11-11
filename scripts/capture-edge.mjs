import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright';

const windows = new Map([
  ['thirty-days', /^(?:last )?30 days$/i],
  ['three-months', /^(?:last )?3 months$/i],
  ['six-months', /^(?:last )?6 months$/i],
  ['more-than-six-months', /^more than 6 months$/i],
  ['all', /^(all|all time)$/i],
]);
const problemLinks = "a[href^='/problems/'][id]";
const scratch = mkdtempSync(join(tmpdir(), 'leetcode-edge-'));

function parseArgs(args) {
  const [companyList = '', second, third] = args;
  const companies = companyList.split(',');
  const singleWindow = args.length === 3;
  if (!companies.every(company => /^[a-z0-9][a-z0-9-]*$/.test(company))
      || new Set(companies).size !== companies.length
      || (singleWindow ? !windows.has(second) || !third : args.length > 2 || companies.length !== 1)) {
    throw new Error('Usage: npm run capture:edge company [output-directory]\n       npm run capture:edge company[,company...] window output-directory');
  }
  const output = singleWindow ? third : second;
  const today = new Date();
  const date = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-');
  return {
    companies,
    selectedWindows: singleWindow ? [second] : [...windows.keys()],
    output: output ? resolve(output) : resolve('captures', date),
  };
}

function browserEndpoint() {
  const file = join(homedir(), 'Library/Application Support/Microsoft Edge/DevToolsActivePort');
  if (!existsSync(file)) {
    throw new Error('Enable remote debugging in Edge at edge://inspect and leave Edge open.');
  }
  const [port, path] = readFileSync(file, 'utf8').trim().split(/\r?\n/);
  if (!/^\d{1,5}$/.test(port) || !/^\/devtools\/browser\/[\da-f-]+$/i.test(path ?? '')) {
    throw new Error('Edge wrote an invalid debugging address.');
  }
  return `ws://127.0.0.1:${port}${path}`;
}

function maven(args, env = process.env) {
  const result = spawnSync('mvn', args, { env, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error('Maven failed. See its output above.');
}

async function capture(page, company, window) {
  const url = new URL(`https://leetcode.com/company/${company}/`);
  const slug = `${company}-${window}`;
  url.searchParams.set('favoriteSlug', slug);
  const pagination = { totals: new Set(), reachedLastPage: false };
  const observePagination = async response => {
    if (new URL(response.url()).origin !== url.origin ||
        new URL(response.url()).pathname.replace(/\/$/, '') !== '/graphql') return;
    try {
      const request = response.request().postDataJSON();
      if (!JSON.stringify(request?.variables ?? {}).includes(JSON.stringify(slug))) return;
      const { data } = await response.json();
      const list = data?.favoriteQuestionList;
      if (!Number.isInteger(list?.totalLength) || typeof list.hasMore !== 'boolean') return;
      pagination.totals.add(list.totalLength);
      if (!list.hasMore) pagination.reachedLastPage = true;
    } catch {
      // A failed or unrelated response cannot establish completeness.
    }
  };
  page.on('response', observePagination);
  try {
    return await captureList(page, url, company, window, pagination);
  } finally {
    page.off('response', observePagination);
  }
}

async function captureList(page, url, company, window, pagination) {
  await page.goto(url.href, { waitUntil: 'domcontentloaded', timeout: 30000 });
  const rows = page.locator(problemLinks);
  await rows.first().waitFor({ timeout: 20000 });

  const current = new URL(page.url());
  if (current.origin !== url.origin || current.pathname.replace(/\/$/, '') !== url.pathname.replace(/\/$/, '')
      || current.searchParams.get('favoriteSlug') !== url.searchParams.get('favoriteSlug')) {
    throw new Error(`Edge did not stay on the requested list for ${company} / ${window}.`);
  }

  const selectedFilter = page.locator('.company-container div.flex.items-center')
    .filter({ has: page.locator('.fa-chevron-down'), hasText: windows.get(window), visible: true })
    .first();
  const captured = new Map();
  let expectedTotal = null;
  let stop = 'scroll limit reached';
  let idlePasses = 0;

  for (let attempt = 0; attempt < 30; attempt++) {
    const sizeBefore = captured.size;
    for (const [url, html] of await rows.evaluateAll(links => links.map(link => [
      new URL(link.href).pathname.replace(/\/$/, ''), link.outerHTML,
    ]))) {
      captured.set(url, html);
    }
    expectedTotal = pagination.totals.size === 1 ? [...pagination.totals][0] : null;
    if (pagination.reachedLastPage && captured.size === expectedTotal) {
      stop = 'reached final page and matched reported total';
      break;
    }

    idlePasses = captured.size === sizeBefore ? idlePasses + 1 : 0;
    if (idlePasses === 3) {
      stop = 'no new rows after three scroll attempts';
      break;
    }
    await rows.last().scrollIntoViewIfNeeded();
    await page.waitForTimeout(1500);
  }

  const frequencyBars = [...captured.values()].some(html => html.includes('bg-brand-orange'));
  if (!frequencyBars) {
    throw new Error(`No frequency bars found for ${company} / ${window}. Check Premium access and page layout.`);
  }
  const visibleFilter = await selectedFilter.waitFor({ state: 'visible', timeout: 5000 })
    .then(() => true, () => false);
  return {
    html: [...captured.values()].join('\n'),
    uniqueRows: captured.size,
    expectedTotal,
    reachedLastPage: pagination.reachedLastPage,
    stop,
    visibleFilter,
    complete: visibleFilter && stop === 'reached final page and matched reported total',
  };
}

let browser;
let page;
try {
  const options = parseArgs(process.argv.slice(2));
  const { output } = options;
  const jobs = options.companies.flatMap(company => options.selectedWindows.map(window => ({
    company,
    window,
    csv: join(output, company, `${window}.csv`),
  })));
  mkdirSync(output, { recursive: true });
  for (const { csv } of jobs) {
    for (const file of [csv, `${csv}.json`]) {
      if (existsSync(file)) throw new Error(`Output already exists: ${file}`);
    }
  }

  maven(['-q', 'org.apache.maven.plugins:maven-compiler-plugin:3.14.1:compile']);
  console.log('Connecting to Edge. Click Allow if Edge asks for permission.');
  browser = await chromium.connectOverCDP(browserEndpoint(), { timeout: 30000 });
  const context = browser.contexts().find(context => context.pages().some(page =>
    page.url().startsWith('https://leetcode.com/'))) ?? browser.contexts()[0];
  page = await context.newPage();

  for (const { company, window, csv } of jobs) {
    const result = await capture(page, company, window);
    const html = join(scratch, 'rows.html');
    writeFileSync(html, result.html);
    maven(['-q', 'org.codehaus.mojo:exec-maven-plugin:3.5.0:java',
      '-Dexec.mainClass=Main', '-Dexec.args=--import-html'], {
      ...process.env, LEETCODE_CAPTURE_HTML: html, LEETCODE_CAPTURE_CSV: csv,
    });
    const { html: capturedHtml, ...report } = result;
    writeFileSync(`${csv}.json`, JSON.stringify({
      company, window, capturedAt: new Date().toISOString(), ...report,
    }, null, 2) + '\n', { flag: 'wx' });
    console.log(`${company} / ${window}: ${report.uniqueRows} unique rows; ${report.stop}.`);
    console.log(`Filter UI: ${report.visibleFilter ? 'verified' : 'unverified'}; completeness: ${report.complete ? 'verified' : 'unverified'}.`);
    console.log(`CSV: ${csv}`);
  }
} catch (error) {
  console.error(error.message.replace(/ws:\/\/[^\s]+/g, '[Edge debugging address]'));
  process.exitCode = 1;
} finally {
  try {
    if (page) await page.close();
  } finally {
    if (browser) await browser.close();
    rmSync(scratch, { recursive: true, force: true });
  }
}
