import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'file:///C:/Users/Mira%20Alexandre/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';

const baseUrl = process.argv[2] || 'https://devisia.vercel.app';
const outputDirectory = process.argv[3] || path.join(process.cwd(), '.qa-public');
const saveScreenshots = process.env.QA_SCREENSHOTS !== '0';
const routes = ['/', '/features', '/pricing', '/auth/login', '/auth/forgot-password'];
const viewports = [
  { name: '375x812', width: 375, height: 812 },
  { name: '390x844', width: 390, height: 844 },
  { name: '430x932', width: 430, height: 932 },
];

await mkdir(outputDirectory, { recursive: true });
const browser = await chromium.launch({
  executablePath: 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  headless: true,
});
const report = [];

try {
  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    const consoleErrors = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });

    for (const route of routes) {
      consoleErrors.length = 0;
      const response = await page.goto(new URL(route, baseUrl).toString(), {
        waitUntil: 'domcontentloaded',
        timeout: 30_000,
      });
      await page.waitForTimeout(750);
      const layout = await page.evaluate(() => ({
        innerWidth: window.innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        title: document.title,
        overflowingElements: [...document.querySelectorAll('body *')]
          .map((element) => {
            const rect = element.getBoundingClientRect();
            return {
              tag: element.tagName.toLowerCase(),
              id: element.id,
              classes: typeof element.className === 'string' ? element.className : '',
              left: Math.round(rect.left),
              right: Math.round(rect.right),
              width: Math.round(rect.width),
              text: element.textContent?.trim().slice(0, 80) || '',
            };
          })
          .filter((element) => element.left < -1 || element.right > window.innerWidth + 1)
          .slice(0, 12),
      }));
      const name = `${route === '/' ? 'landing' : route.slice(1).replaceAll('/', '-')}-${viewport.name}`;
      if (saveScreenshots) {
        await page.screenshot({
          path: path.join(outputDirectory, `${name}.png`),
          fullPage: true,
        });
      }
      report.push({
        route,
        viewport: viewport.name,
        status: response?.status() ?? null,
        overflow: layout.scrollWidth > layout.innerWidth,
        ...layout,
        consoleErrors: [...consoleErrors],
      });
    }

    await context.close();
  }
} finally {
  await browser.close();
}

await writeFile(
  path.join(outputDirectory, 'report.json'),
  `${JSON.stringify(report, null, 2)}\n`,
  'utf8',
);
console.log(JSON.stringify(report, null, 2));
