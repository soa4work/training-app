import { el, topbar } from '../components.js'
import { navigate } from '../router.js'
import { t } from '../../i18n/ru.js'
import { getWorkout, updateWorkout, deleteWorkout, listExerciseNames } from '../../core/storage.js'
import { createExerciseObject, createSetObject } from '../../core/model.js'

// Редактор с единым источником правды в памяти (объект `w`). Любая правка меняет
// `w` мгновенно и целиком пишется в базу — это исключает гонку чтение-изменение-
// запись (из-за которой вес терялся при добавлении подхода).
export async function workoutView(root, params) {
  const w = await getWorkout(params.id)
  if (!w) {
    navigate('#/')
    return
  }

  // Подсказки для автозаполнения названий упражнений (ранее введённые).
  const knownNames = await listExerciseNames()

  // Сохранить весь документ. Пишем целиком — согласованно и без потерь.
  function save() {
    return updateWorkout(w.id, { date: w.date, note: w.note, exercises: w.exercises })
  }

  const back = el('button', {
    class: 'link',
    onclick: async () => {
      await save()
      navigate('#/')
    }
  }, '‹ ' + t.tabHistory)

  root.appendChild(topbar(t.editWorkout, { left: back }))

  const content = el('main', { class: 'content' })
  root.appendChild(content)

  // Список подсказок названий упражнений.
  const datalist = el(
    'datalist',
    { id: 'exercise-names' },
    knownNames.map((n) => el('option', { value: n }))
  )
  root.appendChild(datalist)

  // Какое поле сфокусировать после перерисовки (id элемента через data-fid).
  let pendingFocus = null

  function render() {
    content.replaceChildren()

    // Дата
    content.appendChild(
      el('div', { class: 'field' }, [
        el('label', {}, t.date),
        el('input', {
          type: 'date',
          value: w.date,
          onchange: (e) => {
            w.date = e.target.value
            save()
          }
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
          oninput: (e) => {
            w.note = e.target.value
            save()
          }
        })
      ])
    )

    content.appendChild(el('div', { class: 'section-title' }, t.exercises))

    if (!w.exercises.length) {
      content.appendChild(el('div', { class: 'muted', style: 'margin-bottom:14px' }, t.noExercises))
    }

    for (const ex of w.exercises) content.appendChild(renderExercise(ex))

    // Добавить упражнение
    content.appendChild(
      el('button', {
        class: 'btn secondary',
        onclick: () => {
          const ex = createExerciseObject('')
          w.exercises.push(ex)
          pendingFocus = 'ex:' + ex.id
          save()
          render()
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

    applyFocus()
  }

  function renderExercise(ex) {
    const box = el('div', { class: 'exercise' })

    // Заголовок: имя (с автоподсказками) + удалить
    box.appendChild(
      el('div', { class: 'exercise-head' }, [
        el('input', {
          type: 'text',
          value: ex.name,
          placeholder: t.exerciseNamePlaceholder,
          list: 'exercise-names',
          autocapitalize: 'sentences',
          'data-fid': 'ex:' + ex.id,
          oninput: (e) => {
            ex.name = e.target.value
            save()
          }
        }),
        el('button', {
          class: 'icon-btn',
          'aria-label': t.confirmDeleteExercise,
          onclick: () => {
            if (confirm(t.confirmDeleteExercise)) {
              w.exercises = w.exercises.filter((e) => e.id !== ex.id)
              save()
              render()
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
          setInput(s, 'reps', '1'),
          setInput(s, 'weight', '0.5'),
          el('button', {
            class: 'icon-btn',
            'aria-label': 'Удалить подход',
            onclick: () => {
              ex.sets = ex.sets.filter((x) => x.id !== s.id)
              save()
              render()
            }
          }, '✕')
        ])
      )
    })

    // Добавить подход — копирует значения предыдущего (частый сценарий в зале).
    box.appendChild(
      el('button', {
        class: 'btn ghost',
        onclick: () => {
          const last = ex.sets[ex.sets.length - 1]
          const set = createSetObject(last ? last.reps : 0, last ? last.weight : 0)
          ex.sets.push(set)
          pendingFocus = 'set:' + set.id + ':reps'
          save()
          render()
        }
      }, '＋ ' + t.addSet)
    )

    return box
  }

  // Числовое поле подхода: пустое (плейсхолдер) вместо 0, парсинг при вводе.
  function setInput(s, key, step) {
    const num = s[key]
    return el('input', {
      type: 'number',
      inputmode: 'decimal',
      min: '0',
      step,
      value: num === 0 ? '' : String(num),
      placeholder: '0',
      'data-fid': 'set:' + s.id + ':' + key,
      oninput: (e) => {
        const v = e.target.value
        s[key] = v === '' ? 0 : Number(v) || 0
        save()
      }
    })
  }

  // Поставить фокус на только что добавленный элемент (и курсор в конец).
  function applyFocus() {
    if (!pendingFocus) return
    const node = content.querySelector(`[data-fid="${pendingFocus}"]`)
    pendingFocus = null
    if (!node) return
    node.focus()
    const val = node.value
    if (val) {
      try { node.setSelectionRange(val.length, val.length) } catch {}
    }
  }

  render()
}
