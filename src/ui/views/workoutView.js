import { el, topbar, numberInput } from '../components.js'
import { navigate } from '../router.js'
import { t } from '../../i18n/ru.js'
import {
  getWorkout,
  updateWorkout,
  deleteWorkout,
  addExercise,
  updateExercise,
  removeExercise,
  addSet,
  updateSet,
  removeSet
} from '../../core/storage.js'

export async function workoutView(root, params) {
  let w = await getWorkout(params.id)
  if (!w) {
    navigate('#/')
    return
  }

  const back = el('button', {
    class: 'link',
    onclick: () => navigate('#/')
  }, '‹ ' + t.tabHistory)

  root.appendChild(topbar(t.editWorkout, { left: back }))

  const content = el('main', { class: 'content' })
  root.appendChild(content)

  // Перечитать из хранилища и перерисовать редактор (после структурных изменений).
  async function reload() {
    w = await getWorkout(params.id)
    renderEditor()
  }

  function renderEditor() {
    content.replaceChildren()

    // Дата
    content.appendChild(
      el('div', { class: 'field' }, [
        el('label', {}, t.date),
        el('input', {
          type: 'date',
          value: w.date,
          onchange: (e) => updateWorkout(w.id, { date: e.target.value })
        })
      ])
    )

    // Заметка
    content.appendChild(
      el('div', { class: 'field' }, [
        el('label', {}, t.note),
        el('input', {
          type: 'text',
          value: w.note || '',
          placeholder: t.notePlaceholder,
          onchange: (e) => updateWorkout(w.id, { note: e.target.value })
        })
      ])
    )

    content.appendChild(el('div', { class: 'section-title' }, t.exercises))

    if (!w.exercises.length) {
      content.appendChild(el('div', { class: 'muted', style: 'margin-bottom:14px' }, t.noExercises))
    }

    for (const ex of w.exercises) {
      content.appendChild(renderExercise(ex))
    }

    // Добавить упражнение
    content.appendChild(
      el('button', {
        class: 'btn secondary',
        onclick: async () => {
          await addExercise(w.id, '')
          await reload()
        }
      }, '＋ ' + t.addExercise)
    )

    // Удалить тренировку
    content.appendChild(
      el('div', { style: 'margin-top:28px; text-align:center' }, [
        el('button', {
          class: 'btn danger',
          onclick: async () => {
            if (confirm(t.confirmDeleteWorkout)) {
              await deleteWorkout(w.id)
              navigate('#/')
            }
          }
        }, '🗑 ' + t.deleteWorkout)
      ])
    )
  }

  function renderExercise(ex) {
    const box = el('div', { class: 'exercise' })

    // Заголовок: имя + удалить
    box.appendChild(
      el('div', { class: 'exercise-head' }, [
        el('input', {
          type: 'text',
          value: ex.name,
          placeholder: t.exerciseNamePlaceholder,
          onchange: (e) => updateExercise(w.id, ex.id, { name: e.target.value })
        }),
        el('button', {
          class: 'icon-btn',
          'aria-label': t.confirmDeleteExercise,
          onclick: async () => {
            if (confirm(t.confirmDeleteExercise)) {
              await removeExercise(w.id, ex.id)
              await reload()
            }
          }
        }, '✕')
      ])
    )

    // Шапка колонок
    if (ex.sets.length) {
      box.appendChild(
        el('div', { class: 'set-head' }, [
          el('span', {}, '#'),
          el('span', {}, t.reps),
          el('span', {}, t.weight),
          el('span', {}, '')
        ])
      )
    }

    // Подходы
    ex.sets.forEach((s, i) => {
      box.appendChild(
        el('div', { class: 'set-row' }, [
          el('span', { class: 'idx' }, String(i + 1)),
          numberInput({
            value: s.reps,
            step: '1',
            onchange: (e) => updateSet(w.id, ex.id, s.id, { reps: e.target.value })
          }),
          numberInput({
            value: s.weight,
            step: '0.5',
            onchange: (e) => updateSet(w.id, ex.id, s.id, { weight: e.target.value })
          }),
          el('button', {
            class: 'icon-btn',
            'aria-label': 'Удалить подход',
            onclick: async () => {
              await removeSet(w.id, ex.id, s.id)
              await reload()
            }
          }, '✕')
        ])
      )
    })

    // Добавить подход (копирует значения предыдущего для удобства)
    box.appendChild(
      el('button', {
        class: 'btn ghost',
        onclick: async () => {
          const last = ex.sets[ex.sets.length - 1]
          await addSet(w.id, ex.id, last ? { reps: last.reps, weight: last.weight } : {})
          await reload()
        }
      }, '＋ ' + t.addSet)
    )

    return box
  }

  renderEditor()
}
