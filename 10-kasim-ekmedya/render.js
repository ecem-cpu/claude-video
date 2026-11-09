// Renders story.html to frames and encodes MP4 + a still PNG.
// Usage: node render.js [coral|gold|ink]
const { chromium } = require('playwright');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const FPS = 30;
const variant = process.argv[2] || 'coral';
const dir = __dirname;
const framesDir = path.join(dir, '.frames-' + variant);

(async () => {
  fs.rmSync(framesDir, { recursive: true, force: true });
  fs.mkdirSync(framesDir);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  await page.goto('file://' + path.join(dir, 'story.html') + '?capture&logo=' + variant);
  await page.evaluate(() => document.fonts.ready);
  const duration = await page.evaluate(() => window.DURATION);
  const n = Math.round(duration * FPS);
  for (let f = 0; f < n; f++) {
    await page.evaluate(t => window.render(t), f / FPS);
    await page.screenshot({ path: path.join(framesDir, `f${String(f).padStart(4, '0')}.png`) });
  }
  await page.evaluate(() => window.render(11.8));
  await page.screenshot({ path: path.join(dir, `10-kasim-ekmedya-story-${variant}.png`) });
  await browser.close();
  execSync(`ffmpeg -y -loglevel error -framerate ${FPS} -i "${framesDir}/f%04d.png" -c:v libx264 -pix_fmt yuv420p -crf 18 -movflags +faststart "${path.join(dir, `10-kasim-ekmedya-story-${variant}.mp4`)}"`);
  fs.rmSync(framesDir, { recursive: true, force: true });
  console.log('done');
})();
