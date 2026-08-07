// Фабрики объектов модели и валидация. Без DOM — часть переносимого ядра.

/**
 * @typedef {Object} Set
 * @property {string} id
 * @property {number} reps   Количество повторений (>= 0)
 * @property {number} weight Вес в кг (>= 0; 0 = свой вес)
 *
 * @typedef {Object} Exercise
 * @property {string} id
 * @property {string} name
 * @property {Set[]} sets
 *
 * @typedef {Object} Workout
 * @property {string} id
 * @property {string} date        ISO-дата "YYYY-MM-DD" (локальный день)
 * @property {string} note
 * @property {Exercise[]} exercises
 * @property {number} createdAt   epoch ms
 * @property {number} updatedAt   epoch ms
 */

/** Сгенерировать уникальный id. */
export function newId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10)
}

/** Сегодняшняя дата в формате YYYY-MM-DD (локальная). */
export function todayISO() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** @returns {Set} */
export function createSetObject(reps = 0, weight = 0) {
  return { id: newId(), reps: Number(reps) || 0, weight: Number(weight) || 0 }
}

/** @returns {Exercise} */
export function createExerciseObject(name = '') {
  return { id: newId(), name: String(name), sets: [] }
}

/** @returns {Workout} */
export function createWorkoutObject(partial = {}) {
  const now = Date.now()
  return {
    id: partial.id || newId(),
    date: partial.date || todayISO(),
    note: partial.note || '',
    exercises: partial.exercises || [],
    createdAt: partial.createdAt || now,
    updatedAt: partial.updatedAt || now
  }
}

/** Базовая проверка формы тренировки. Возвращает true/false. */
export function validateWorkout(w) {
  if (!w || typeof w !== 'object') return false
  if (typeof w.id !== 'string' || !w.id) return false
  if (typeof w.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(w.date)) return false
  if (!Array.isArray(w.exercises)) return false
  for (const ex of w.exercises) {
    if (typeof ex.id !== 'string' || typeof ex.name !== 'string') return false
    if (!Array.isArray(ex.sets)) return false
    for (const s of ex.sets) {
      if (typeof s.id !== 'string') return false
      if (typeof s.reps !== 'number' || typeof s.weight !== 'number') return false
    }
  }
  return true
}

/** Нормализованный ключ имени упражнения для сопоставления (без учёта регистра/пробелов). */
export function normalizeName(name) {
  return String(name || '').trim().toLowerCase()
}
