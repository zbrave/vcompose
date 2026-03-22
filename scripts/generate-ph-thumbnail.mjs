import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const templatePath = resolve(__dirname, 'ph-thumbnail-template.html');
const outputPath = resolve(__dirname, '..', 'public', 'ph-thumbnail.png');

async function generate() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.setViewportSize({ width: 240, height: 240 });
  await page.goto(`file://${templatePath.replace(/\\/g, '/')}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  await page.screenshot({
    path: outputPath,
    type: 'png',
    clip: { x: 0, y: 0, width: 240, height: 240 }
  });

  await browser.close();
  console.log(`PH thumbnail generated: ${outputPath}`);
}

generate().catch(console.error);
