// Простой hash-роутер. Работает офлайн (без History API и серверных rewrite).

const routes = []
let notFound = null
let root = null

/** Зарегистрировать маршрут: pattern вида '#/workout/:id'. */
export function route(pattern, handler) {
  routes.push({ parts: pattern.replace(/^#/, '').split('/'), handler })
}

export function setNotFound(handler) {
  notFound = handler
}

/** Запустить роутер, рендер в указанный контейнер. */
export function startRouter(container) {
  root = container
  window.addEventListener('hashchange', render)
  render()
}

/** Программная навигация. */
export function navigate(hash) {
  if (location.hash === hash) render()
  else location.hash = hash
}

function match(hash) {
  const path = hash.replace(/^#/, '') || '/'
  const segs = path.split('/')
  for (const r of routes) {
    if (r.parts.length !== segs.length) continue
    const params = {}
    let ok = true
    for (let i = 0; i < r.parts.length; i++) {
      const p = r.parts[i]
      if (p.startsWith(':')) params[p.slice(1)] = decodeURIComponent(segs[i])
      else if (p !== segs[i]) { ok = false; break }
    }
    if (ok) return { handler: r.handler, params }
  }
  return null
}

async function render() {
  const hash = location.hash || '#/'
  const m = match(hash)
  root.replaceChildren()
  window.scrollTo(0, 0)
  try {
    if (m) await m.handler(root, m.params)
    else if (notFound) await notFound(root)
  } catch (err) {
    console.error('Ошибка рендера маршрута', err)
    root.textContent = 'Произошла ошибка. Попробуйте перезагрузить.'
  }
}

/** Перерисовать текущий маршрут (например, после мутации данных). */
export function refresh() {
  render()
}
