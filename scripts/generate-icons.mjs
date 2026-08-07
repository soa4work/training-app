// Генерация PNG-иконок из scripts/icon.svg через уже установленный Chromium
// (Playwright). Не требует sharp/ImageMagick и работает на Linux.
//
// Запуск: npm run icons
//
// Выход: public/icons/icon-192.png, icon-512.png, apple-touch-icon.png (180x180)

import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const outDir = join(root, 'public', 'icons')
mkdirSync(outDir, { recursive: true })

const svg = readFileSync(join(__dirname, 'icon.svg'), 'utf8')

const targets = [
  { file: 'icon-192.png', size: 192 },
  { file: 'icon-512.png', size: 512 },
  // apple-touch-icon: непрозрачный фон (iOS плохо показывает прозрачность).
  { file: 'apple-touch-icon.png', size: 180 }
]

// Используем предустановленный Chromium (версия npm-пакета Playwright может не
// совпадать с версией скачанного браузера, поэтому задаём путь явно).
const execPath = process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium'
const browser = await chromium.launch({ executablePath: execPath })
try {
  for (const { file, size } of targets) {
    const page = await browser.newPage({
      viewport: { width: size, height: size },
      deviceScaleFactor: 1
    })
    const html = `<!doctype html><meta charset="utf-8">
      <style>html,body{margin:0;padding:0;background:#111}
      svg{display:block;width:${size}px;height:${size}px}</style>${svg}`
    await page.setContent(html, { waitUntil: 'networkidle' })
    await page.screenshot({ path: join(outDir, file), omitBackground: false })
    await page.close()
    console.log('✓', file, `(${size}x${size})`)
  }
} finally {
  await browser.close()
}
console.log('Иконки сгенерированы в', outDir)
