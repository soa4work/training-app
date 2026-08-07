// Все строки интерфейса — единый источник. Упрощает будущую локализацию/порт.

export const t = {
  appTitle: 'Дневник тренировок',

  // Навигация
  tabHistory: 'История',
  tabProgress: 'Прогресс',

  // История
  historyTitle: 'История тренировок',
  emptyHistory: 'Пока нет тренировок',
  emptyHistoryHint: 'Нажмите «＋», чтобы записать первую',
  exercisesCount: (n) => `${n} ${plural(n, 'упражнение', 'упражнения', 'упражнений')}`,
  setsCount: (n) => `${n} ${plural(n, 'подход', 'подхода', 'подходов')}`,

  // Редактор тренировки
  newWorkout: 'Новая тренировка',
  editWorkout: 'Тренировка',
  date: 'Дата',
  note: 'Заметка',
  notePlaceholder: 'Например: самочувствие, зал…',
  exercises: 'Упражнения',
  addExercise: 'Добавить упражнение',
  exerciseNamePlaceholder: 'Название упражнения',
  noExercises: 'Добавьте первое упражнение',
  set: 'Подход',
  reps: 'Повт.',
  weight: 'Вес, кг',
  addSet: 'Добавить подход',
  deleteWorkout: 'Удалить тренировку',
  confirmDeleteWorkout: 'Удалить эту тренировку?',
  confirmDeleteExercise: 'Удалить упражнение?',
  back: 'Назад',
  done: 'Готово',

  // Прогресс
  progressTitle: 'Прогресс',
  selectExercise: 'Упражнение',
  metricMax: 'Макс. вес',
  metric1rm: 'Расч. 1ПМ',
  metricVolume: 'Объём',
  noData: 'Недостаточно данных',
  noDataHint: 'Запишите упражнение хотя бы в двух тренировках',
  noExercisesYet: 'Ещё нет записанных упражнений',
  statBest: 'Рекорд',
  statLast: 'Последнее',
  statChange: 'Изменение',
  kg: 'кг',

  // Подсказка про установку
  installHint:
    'Совет: откройте «Поделиться» → «На экран „Домой“», чтобы пользоваться как приложением офлайн.',
  installClose: 'Понятно'
}

// Русский плюрализатор (1 упражнение / 2 упражнения / 5 упражнений).
function plural(n, one, few, many) {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few
  return many
}

/** Отформатировать ISO-дату (YYYY-MM-DD) как «7 авг 2026». */
export function formatDate(iso) {
  const [y, m, d] = String(iso).split('-').map(Number)
  const months = [
    'янв', 'фев', 'мар', 'апр', 'мая', 'июн',
    'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'
  ]
  if (!y || !m || !d) return iso
  return `${d} ${months[m - 1]} ${y}`
}
