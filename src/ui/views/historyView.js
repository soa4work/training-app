import { el, topbar, tabbar } from '../components.js'
import { navigate } from '../router.js'
import { t, formatDate } from '../../i18n/ru.js'
import { getAllWorkouts, createWorkout } from '../../core/storage.js'

const HINT_KEY = 'ta-install-hint-dismissed'

export async function historyView(root) {
  const workouts = await getAllWorkouts()

  root.appendChild(topbar(t.historyTitle))

  const content = el('main', { class: 'content' })

  // Разовая подсказка про установку на iPhone.
  if (!localStorage.getItem(HINT_KEY) && isIOSSafari()) {
    const hint = el('div', { class: 'hint' }, [
      el('span', {}, '📲'),
      el('span', {}, t.installHint),
      el('button', {
        onclick: (e) => {
          localStorage.setItem(HINT_KEY, '1')
          e.target.closest('.hint').remove()
        }
      }, t.installClose)
    ])
    content.appendChild(hint)
  }

  if (!workouts.length) {
    content.appendChild(
      el('div', { class: 'empty' }, [
        el('div', { class: 'big' }, '🏋️'),
        el('div', {}, t.emptyHistory),
        el('div', { class: 'muted' }, t.emptyHistoryHint)
      ])
    )
  } else {
    for (const w of workouts) {
      const setCount = w.exercises.reduce((n, e) => n + e.sets.length, 0)
      const summary = w.exercises.length
        ? `${t.exercisesCount(w.exercises.length)} · ${t.setsCount(setCount)}`
        : t.emptyHistory
      content.appendChild(
        el('div', {
          class: 'list-row',
          onclick: () => navigate('#/workout/' + w.id)
        }, [
          el('div', { class: 'grow' }, [
            el('div', { class: 'title' }, formatDate(w.date)),
            el('div', { class: 'sub' }, summary)
          ]),
          el('span', { class: 'chev' }, '›')
        ])
      )
    }
  }

  root.appendChild(content)

  // Кнопка «+» — создать новую тренировку и перейти в редактор.
  root.appendChild(
    el('button', {
      class: 'fab',
      'aria-label': t.newWorkout,
      onclick: async () => {
        const w = await createWorkout()
        navigate('#/workout/' + w.id)
      }
    }, '＋')
  )

  root.appendChild(tabbar('history'))
}

function isIOSSafari() {
  const ua = navigator.userAgent
  const iOS = /iP(hone|ad|od)/.test(ua)
  const standalone = window.navigator.standalone === true
  return iOS && !standalone
}
