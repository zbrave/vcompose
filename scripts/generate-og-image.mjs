import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const templatePath = resolve(__dirname, 'og-image-template.html');
const outputPath = resolve(__dirname, '..', 'public', 'og-image.png');

async function generate() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.setViewportSize({ width: 1200, height: 630 });
  await page.goto(`file://${templatePath.replace(/\\/g, '/')}`, { waitUntil: 'networkidle' });

  // Wait for fonts to load
  await page.waitForTimeout(2000);

  await page.screenshot({
    path: outputPath,
    type: 'png',
    clip: { x: 0, y: 0, width: 1200, height: 630 }
  });

  await browser.close();
  console.log(`OG image generated: ${outputPath}`);
}

generate().catch(console.error);
