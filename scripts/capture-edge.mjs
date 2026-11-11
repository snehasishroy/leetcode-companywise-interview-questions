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
  if (args.length === 0) {
    return { companies: ['google'], window: 'three-months', output: scratch };
  }
  const [companyList, window, output] = args;
  const companies = companyList.split(',');
  if (args.length !== 3 || !companies.every(company => /^[a-z0-9][a-z0-9-]*$/.test(company))
      || new Set(companies).size !== companies.length || !windows.has(window)) {
    throw new Error('Usage: npm run capture:edge -- [company[,company...] window output-directory]');
  }
  return { companies, window, output: resolve(output) };
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

  const visibleFilter = await page.locator('.company-container div.flex.items-center')
    .filter({ has: page.locator('.fa-chevron-down'), hasText: windows.get(window), visible: true })
    .count() > 0;
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
let output;
try {
  const options = parseArgs(process.argv.slice(2));
  output = options.output;
  mkdirSync(output, { recursive: true });
  for (const company of options.companies) {
    const csv = join(output, company, `${options.window}.csv`);
    if (existsSync(csv)) throw new Error(`Output already exists: ${csv}`);
  }

  maven(['-q', 'org.apache.maven.plugins:maven-compiler-plugin:3.14.1:compile']);
  console.log('Connecting to Edge. Click Allow if Edge asks for permission.');
  browser = await chromium.connectOverCDP(browserEndpoint(), { timeout: 30000 });
  const context = browser.contexts().find(context => context.pages().some(page =>
    page.url().startsWith('https://leetcode.com/'))) ?? browser.contexts()[0];
  page = await context.newPage();

  for (const company of options.companies) {
    const result = await capture(page, company, options.window);
    const html = join(scratch, 'rows.html');
    const csv = join(output, company, `${options.window}.csv`);
    writeFileSync(html, result.html);
    maven(['-q', 'org.codehaus.mojo:exec-maven-plugin:3.5.0:java',
      '-Dexec.mainClass=Main', '-Dexec.args=--import-html'], {
      ...process.env, LEETCODE_CAPTURE_HTML: html, LEETCODE_CAPTURE_CSV: csv,
    });
    const { html: capturedHtml, ...report } = result;
    writeFileSync(`${csv}.json`, JSON.stringify({
      company, window: options.window, capturedAt: new Date().toISOString(), ...report,
    }, null, 2) + '\n', { flag: 'wx' });
    console.log(`${company} / ${options.window}: ${report.uniqueRows} unique rows; ${report.stop}.`);
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
    if (output !== scratch) rmSync(scratch, { recursive: true, force: true });
    else rmSync(join(scratch, 'rows.html'), { force: true });
  }
}
