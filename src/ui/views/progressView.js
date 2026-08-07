import { el, topbar, tabbar } from '../components.js'
import { t } from '../../i18n/ru.js'
import { listExerciseNames, getExerciseHistory } from '../../core/storage.js'
import { buildSeries } from '../../core/analytics.js'
import { renderLineChart } from '../chart.js'

const SEL_KEY = 'ta-progress-exercise'

export async function progressView(root) {
  root.appendChild(topbar(t.progressTitle))

  const content = el('main', { class: 'content' })
  root.appendChild(content)

  const names = await listExerciseNames()

  if (!names.length) {
    content.appendChild(
      el('div', { class: 'empty' }, [
        el('div', { class: 'big' }, '📈'),
        el('div', {}, t.noExercisesYet)
      ])
    )
    root.appendChild(tabbar('progress'))
    return
  }

  // Восстановить прошлый выбор, если он ещё существует.
  const saved = localStorage.getItem(SEL_KEY)
  let selected = names.includes(saved) ? saved : names[0]
  let metric = 'max' // 'max' | '1rm' | 'volume'

  // Селектор упражнения
  const select = el('select', {
    onchange: (e) => {
      selected = e.target.value
      localStorage.setItem(SEL_KEY, selected)
      draw()
    }
  }, names.map((n) => {
    const opt = el('option', { value: n }, n)
    if (n === selected) opt.selected = true
    return opt
  }))

  content.appendChild(
    el('div', { class: 'field' }, [
      el('label', {}, t.selectExercise),
      select
    ])
  )

  // Переключатель метрики
  const segBtn = (key, label) =>
    el('button', {
      class: metric === key ? 'active' : '',
      onclick: () => {
        metric = key
        updateSegments()
        draw()
      }
    }, label)

  const segments = el('div', { class: 'segmented' }, [
    segBtn('max', t.metricMax),
    segBtn('1rm', t.metric1rm),
    segBtn('volume', t.metricVolume)
  ])
  content.appendChild(segments)

  function updateSegments() {
    ;[...segments.children].forEach((btn, i) => {
      const key = ['max', '1rm', 'volume'][i]
      btn.className = metric === key ? 'active' : ''
    })
  }

  // Область графика + статистики
  const chartArea = el('div', {})
  const statArea = el('div', {})
  content.appendChild(chartArea)
  content.appendChild(statArea)

  async function draw() {
    const history = await getExerciseHistory(selected)
    const series = buildSeries(history, metric)

    chartArea.replaceChildren()
    statArea.replaceChildren()

    if (series.length < 2) {
      chartArea.appendChild(
        el('div', { class: 'empty' }, [
          el('div', {}, t.noData),
          el('div', { class: 'muted' }, t.noDataHint)
        ])
      )
      return
    }

    renderLineChart(chartArea, series)

    const best = Math.max(...series.map((p) => p.y))
    const last = series[series.length - 1].y
    const first = series[0].y
    const change = last - first
    const changeStr = (change >= 0 ? '+' : '') + fmt(change)

    statArea.appendChild(
      el('div', { class: 'chart-stat' }, [
        stat(t.statBest, fmt(best)),
        stat(t.statLast, fmt(last)),
        stat(t.statChange, changeStr)
      ])
    )
  }

  function stat(lbl, val) {
    return el('div', { class: 'stat' }, [
      el('div', { class: 'val' }, val),
      el('div', { class: 'lbl' }, lbl)
    ])
  }

  function fmt(n) {
    return Math.round(n * 10) / 10 + ' ' + t.kg
  }

  root.appendChild(tabbar('progress'))
  await draw()
}
