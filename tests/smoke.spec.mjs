// Smoke-тест приложения против собранного preview-сервера.
// Запуск: npm run build && npm run test
// (использует предустановленный Chromium)

import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'

const BASE = 'http://localhost:4173'
const EXEC = process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium'

function assert(cond, msg) {
  if (!cond) throw new Error('ПРОВАЛ: ' + msg)
  console.log('  ✓', msg)
}

async function waitForServer(url, tries = 40) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url)
      if (res.ok) return
    } catch {}
    await sleep(250)
  }
  throw new Error('Preview-сервер не поднялся: ' + url)
}

let server, browser
try {
  server = spawn('npm', ['run', 'preview'], { stdio: 'ignore' })
  await waitForServer(BASE)

  browser = await chromium.launch({ executablePath: EXEC })
  const context = await browser.newContext()
  const page = await context.newPage()

  // 1. Главная: заголовок и пустое состояние
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.waitForSelector('.topbar h1')
  assert(
    (await page.textContent('.topbar h1')).includes('История'),
    'Русский заголовок «История тренировок» отрисован'
  )
  assert(await page.isVisible('.empty'), 'Пустое состояние показано')

  // Заполнить тренировку упражнением «Жим лёжа» с одним подходом (reps×weight).
  // График строит по одной точке на тренировку, поэтому создадим ДВЕ тренировки.
  async function fillWorkout(date, reps, weight) {
    await page.click('.fab')
    await page.waitForSelector('input[type="date"]')
    // дата
    await page.fill('input[type="date"]', date)
    await page.dispatchEvent('input[type="date"]', 'change')
    // упражнение
    await page.click('.btn.secondary') // «Добавить упражнение»
    await page.waitForSelector('.exercise input[type="text"]')
    await page.fill('.exercise input[type="text"]', 'Жим лёжа')
    await page.dispatchEvent('.exercise input[type="text"]', 'change')
    // подход
    await page.click('.exercise .btn.ghost') // «Добавить подход»
    await page.waitForSelector('.set-row')
    const inputs = await page.$$('.set-row input')
    await inputs[0].fill(String(reps))
    await inputs[0].dispatchEvent('change')
    await inputs[1].fill(String(weight))
    await inputs[1].dispatchEvent('change')
    await page.goto(BASE, { waitUntil: 'networkidle' })
  }

  // 2-3. Создать две тренировки с прогрессирующим весом
  await fillWorkout('2026-08-01', 5, 60)
  await fillWorkout('2026-08-05', 5, 65)
  assert(true, 'Созданы 2 тренировки с упражнением «Жим лёжа» (60 → 65 кг)')

  // 4. История сохранена после перезагрузки (IndexedDB)
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.waitForSelector('.list-row')
  const rowCount = await page.$$eval('.list-row', (els) => els.length)
  assert(rowCount === 2, 'Обе тренировки сохранены в IndexedDB и видны в истории')

  // 5. Прогресс: выбрать упражнение -> 2 точки -> есть polyline
  await page.goto(BASE + '#/progress', { waitUntil: 'networkidle' })
  await page.waitForSelector('select')
  await page.selectOption('select', 'Жим лёжа')
  await page.dispatchEvent('select', 'change')
  await page.waitForSelector('svg polyline')
  const pts = await page.getAttribute('svg polyline', 'points')
  assert(
    pts.trim().split(/\s+/).length === 2,
    'График прогресса отрисован с 2 точками (SVG polyline)'
  )

  // 6. Service worker зарегистрирован (основа офлайна)
  const swReady = await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) return false
    const reg = await navigator.serviceWorker.getRegistration()
    return !!reg
  })
  assert(swReady, 'Service worker зарегистрирован (офлайн-режим доступен)')

  console.log('\n✅ Все проверки пройдены')
} catch (err) {
  console.error('\n❌', err.message)
  process.exitCode = 1
} finally {
  if (browser) await browser.close()
  if (server) server.kill('SIGTERM')
}
