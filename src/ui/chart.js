// Самописный линейный график на inline-SVG. Без зависимостей.
import { el } from './components.js'
import { formatDate } from '../i18n/ru.js'

const NS = 'http://www.w3.org/2000/svg'

function svgEl(tag, attrs = {}) {
  const node = document.createElementNS(NS, tag)
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v)
  return node
}

/**
 * Отрисовать линейный график ряда [{x:isoDate, y:number}] в контейнер.
 * opts: { unit?: string }
 */
export function renderLineChart(container, series, opts = {}) {
  container.replaceChildren()

  const W = 340
  const H = 200
  const padL = 44
  const padR = 12
  const padT = 14
  const padB = 30

  const svg = svgEl('svg', {
    viewBox: `0 0 ${W} ${H}`,
    preserveAspectRatio: 'xMidYMid meet',
    role: 'img'
  })

  const ys = series.map((p) => p.y)
  let minY = Math.min(...ys)
  let maxY = Math.max(...ys)
  if (minY === maxY) {
    // Расширим диапазон, чтобы линия не легла на край.
    minY = Math.max(0, minY - 1)
    maxY = maxY + 1
  }
  // Немного «воздуха» сверху/снизу.
  const range = maxY - minY
  minY = Math.max(0, minY - range * 0.1)
  maxY = maxY + range * 0.1

  const plotW = W - padL - padR
  const plotH = H - padT - padB

  const xFor = (i) =>
    padL + (series.length === 1 ? plotW / 2 : (i / (series.length - 1)) * plotW)
  const yFor = (v) => padT + plotH - ((v - minY) / (maxY - minY)) * plotH

  // Горизонтальные линии сетки + подписи Y (3 линии).
  const gridN = 3
  for (let g = 0; g <= gridN; g++) {
    const val = minY + ((maxY - minY) * g) / gridN
    const y = yFor(val)
    svg.appendChild(
      svgEl('line', {
        x1: padL, y1: y, x2: W - padR, y2: y,
        stroke: '#38383a', 'stroke-width': 1
      })
    )
    const label = svgEl('text', {
      x: padL - 6, y: y + 4,
      'text-anchor': 'end', fill: '#98989f', 'font-size': 11
    })
    label.textContent = formatNum(val)
    svg.appendChild(label)
  }

  // Линия ряда.
  const points = series.map((p, i) => `${xFor(i)},${yFor(p.y)}`).join(' ')
  if (series.length > 1) {
    svg.appendChild(
      svgEl('polyline', {
        points, fill: 'none', stroke: '#0a84ff',
        'stroke-width': 2.5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round'
      })
    )
  }

  // Точки + подписи дат по X (прореживаем, чтобы не слипались).
  const maxLabels = 5
  const labelStep = Math.ceil(series.length / maxLabels)
  series.forEach((p, i) => {
    const x = xFor(i)
    const y = yFor(p.y)
    svg.appendChild(svgEl('circle', { cx: x, cy: y, r: 3.5, fill: '#0a84ff' }))

    if (i % labelStep === 0 || i === series.length - 1) {
      const label = svgEl('text', {
        x, y: H - 10, 'text-anchor': 'middle', fill: '#98989f', 'font-size': 10
      })
      label.textContent = shortDate(p.x)
      svg.appendChild(label)
    }
  })

  container.appendChild(el('div', { class: 'chart-wrap' }, svg))
}

function formatNum(v) {
  if (v >= 1000) return Math.round(v / 100) / 10 + 'k'
  return Math.round(v * 10) / 10
}

function shortDate(iso) {
  // «7 авг» без года — компактно для оси.
  return formatDate(iso).split(' ').slice(0, 2).join(' ')
}
