// Небольшие помощники рендера DOM. Только UI.

/**
 * Создать элемент: el('div', {class:'x', onclick:fn}, [child, 'text']).
 */
export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag)
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue
    if (k === 'class') node.className = v
    else if (k === 'html') node.innerHTML = v
    else if (k.startsWith('on') && typeof v === 'function') {
      node.addEventListener(k.slice(2).toLowerCase(), v)
    } else if (k === 'value') {
      node.value = v
    } else {
      node.setAttribute(k, v)
    }
  }
  const list = Array.isArray(children) ? children : [children]
  for (const c of list) {
    if (c == null || c === false) continue
    node.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c)
  }
  return node
}

/** Очистить контейнер. */
export function clear(node) {
  node.replaceChildren()
}

/** Верхняя панель с заголовком и опциональными кнопками слева/справа. */
export function topbar(title, { left, right } = {}) {
  return el('header', { class: 'topbar' }, [
    left || false,
    el('h1', {}, title),
    right || false
  ])
}

/** Нижняя навигация с активной вкладкой ('history' | 'progress'). */
export function tabbar(active) {
  const tab = (href, ico, label, key) =>
    el('a', { href, class: active === key ? 'active' : '' }, [
      el('span', { class: 'tab-ico' }, ico),
      el('span', {}, label)
    ])
  return el('nav', { class: 'tabbar' }, [
    tab('#/', '🏋️', 'История', 'history'),
    tab('#/progress', '📈', 'Прогресс', 'progress')
  ])
}

/** Числовой инпут (для повторений/веса), с inputmode для мобильной клавиатуры. */
export function numberInput({ value, placeholder, step, onchange }) {
  return el('input', {
    type: 'number',
    inputmode: 'decimal',
    min: '0',
    step: step || '1',
    value: value ?? '',
    placeholder: placeholder || '',
    onchange
  })
}
