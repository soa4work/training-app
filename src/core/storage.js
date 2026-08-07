// API хранилища тренировок поверх IndexedDB. Всё async.
// Единственный «шов переносимости»: чтобы перейти на Capacitor SQLite или
// нативное хранилище, достаточно переписать этот файл.

import * as idb from './idb.js'
import {
  createWorkoutObject,
  createExerciseObject,
  createSetObject,
  normalizeName,
  validateWorkout
} from './model.js'

/** Открыть базу заранее (вызывается при старте приложения). */
export async function initStorage() {
  await idb.openDB()
}

/** Все тренировки, отсортированные по дате (сначала новые). */
export async function getAllWorkouts() {
  const all = await idb.getAll()
  return all.sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1
    return (b.createdAt || 0) - (a.createdAt || 0)
  })
}

/** Одна тренировка по id или null. */
export async function getWorkout(id) {
  const w = await idb.get(id)
  return w || null
}

/** Создать новую тренировку и сохранить её. */
export async function createWorkout(partial = {}) {
  const w = createWorkoutObject(partial)
  await idb.put(w)
  return w
}

/** Обновить тренировку (поверхностное слияние) и обновить updatedAt. */
export async function updateWorkout(id, changes) {
  const current = await idb.get(id)
  if (!current) throw new Error('Тренировка не найдена: ' + id)
  const updated = { ...current, ...changes, id, updatedAt: Date.now() }
  await idb.put(updated)
  return updated
}

/** Удалить тренировку. */
export async function deleteWorkout(id) {
  await idb.del(id)
}

// --- Удобные обёртки для упражнений/подходов (работают через updateWorkout) ---

async function mutate(workoutId, fn) {
  const w = await idb.get(workoutId)
  if (!w) throw new Error('Тренировка не найдена: ' + workoutId)
  fn(w)
  return updateWorkout(workoutId, { exercises: w.exercises })
}

export function addExercise(workoutId, name = '') {
  return mutate(workoutId, (w) => {
    w.exercises.push(createExerciseObject(name))
  })
}

export function updateExercise(workoutId, exerciseId, changes) {
  return mutate(workoutId, (w) => {
    const ex = w.exercises.find((e) => e.id === exerciseId)
    if (ex) Object.assign(ex, changes)
  })
}

export function removeExercise(workoutId, exerciseId) {
  return mutate(workoutId, (w) => {
    w.exercises = w.exercises.filter((e) => e.id !== exerciseId)
  })
}

export function addSet(workoutId, exerciseId, set = {}) {
  return mutate(workoutId, (w) => {
    const ex = w.exercises.find((e) => e.id === exerciseId)
    if (ex) ex.sets.push(createSetObject(set.reps, set.weight))
  })
}

export function updateSet(workoutId, exerciseId, setId, changes) {
  return mutate(workoutId, (w) => {
    const ex = w.exercises.find((e) => e.id === exerciseId)
    if (!ex) return
    const s = ex.sets.find((x) => x.id === setId)
    if (s) {
      if (changes.reps !== undefined) s.reps = Number(changes.reps) || 0
      if (changes.weight !== undefined) s.weight = Number(changes.weight) || 0
    }
  })
}

export function removeSet(workoutId, exerciseId, setId) {
  return mutate(workoutId, (w) => {
    const ex = w.exercises.find((e) => e.id === exerciseId)
    if (ex) ex.sets = ex.sets.filter((x) => x.id !== setId)
  })
}

// --- Производные запросы для графиков и выбора упражнений ---

/** Список различных имён упражнений (по алфавиту), которые встречаются в тренировках. */
export async function listExerciseNames() {
  const all = await idb.getAll()
  const byKey = new Map() // normalized -> display name
  for (const w of all) {
    for (const ex of w.exercises || []) {
      const key = normalizeName(ex.name)
      if (!key) continue
      if (!byKey.has(key)) byKey.set(key, ex.name.trim())
    }
  }
  return [...byKey.values()].sort((a, b) => a.localeCompare(b, 'ru'))
}

/**
 * История по конкретному упражнению: по одной записи на тренировку, где оно было.
 * Возвращает [{ date, sets }] по возрастанию даты — удобно для графика.
 */
export async function getExerciseHistory(name) {
  const key = normalizeName(name)
  const all = await idb.getAll()
  const out = []
  for (const w of all) {
    const matches = (w.exercises || []).filter((e) => normalizeName(e.name) === key)
    if (!matches.length) continue
    // Если упражнение встречается в тренировке несколько раз — объединяем подходы.
    const sets = matches.flatMap((m) => m.sets || [])
    if (sets.length) out.push({ date: w.date, sets })
  }
  return out.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
}

// --- Экспорт/импорт (бэкап) ---

export async function exportJSON() {
  const all = await getAllWorkouts()
  return JSON.stringify({ version: 1, workouts: all }, null, 2)
}

export async function importJSON(json) {
  const data = typeof json === 'string' ? JSON.parse(json) : json
  const workouts = Array.isArray(data) ? data : data.workouts
  if (!Array.isArray(workouts)) throw new Error('Некорректный формат данных')
  for (const w of workouts) {
    if (validateWorkout(w)) await idb.put(w)
  }
}
