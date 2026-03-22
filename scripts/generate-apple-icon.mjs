import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outputPath = resolve(__dirname, '..', 'public', 'apple-touch-icon.png');

const html = `<!DOCTYPE html>
<html><head><style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 180px; height: 180px;
    background: #141210;
    display: flex; align-items: center; justify-content: center;
    border-radius: 36px;
  }
</style></head>
<body>
  <svg width="120" height="120" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="10" y="14" width="16" height="16" rx="3" stroke="#d4a843" stroke-width="3" fill="rgba(212,168,67,0.15)"/>
    <circle cx="18" cy="22" r="3.5" fill="#d4a843"/>
    <rect x="54" y="14" width="16" height="16" rx="3" stroke="#d4a843" stroke-width="3" fill="rgba(212,168,67,0.15)"/>
    <circle cx="62" cy="22" r="3.5" fill="#d4a843"/>
    <rect x="28" y="48" width="24" height="20" rx="4" stroke="#d4a843" stroke-width="3" fill="rgba(212,168,67,0.2)"/>
    <circle cx="40" cy="58" r="5" fill="#d4a843"/>
    <path d="M22 30 L36 50" stroke="#d4a843" stroke-width="3" stroke-linecap="round"/>
    <path d="M58 30 L44 50" stroke="#d4a843" stroke-width="3" stroke-linecap="round"/>
  </svg>
</body></html>`;

async function generate() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 180, height: 180 });
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.screenshot({ path: outputPath, type: 'png', clip: { x: 0, y: 0, width: 180, height: 180 } });
  await browser.close();
  console.log('Apple touch icon generated:', outputPath);
}

generate().catch(console.error);
