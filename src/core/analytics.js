// Чистые функции аналитики для графиков прогресса. Без DOM/хранилища —
// легко тестировать и переиспользовать при порте.

/** Оценка 1ПМ по формуле Эпли. reps=1 -> вес, reps=0 -> 0. */
export function epley1RM(weight, reps) {
  const w = Number(weight) || 0
  const r = Number(reps) || 0
  if (w <= 0 || r <= 0) return 0
  return w * (1 + r / 30)
}

/** Лучший расчётный 1ПМ среди подходов. */
export function best1RMForSets(sets = []) {
  let best = 0
  for (const s of sets) {
    const v = epley1RM(s.weight, s.reps)
    if (v > best) best = v
  }
  return best
}

/** Максимальный рабочий вес среди подходов. */
export function maxWeightForSets(sets = []) {
  let max = 0
  for (const s of sets) {
    const w = Number(s.weight) || 0
    if (w > max) max = w
  }
  return max
}

/** Суммарный объём: Σ повторения × вес. */
export function totalVolumeForSets(sets = []) {
  let total = 0
  for (const s of sets) {
    total += (Number(s.reps) || 0) * (Number(s.weight) || 0)
  }
  return total
}

/**
 * Построить временной ряд для графика из истории упражнения.
 * @param {Array<{date:string, sets:Array}>} history
 * @param {'max'|'1rm'|'volume'} metric
 * @returns {Array<{x:string, y:number}>}
 */
export function buildSeries(history = [], metric = 'max') {
  const fn =
    metric === '1rm'
      ? best1RMForSets
      : metric === 'volume'
        ? totalVolumeForSets
        : maxWeightForSets
  return history
    .map((h) => ({ x: h.date, y: Math.round(fn(h.sets) * 100) / 100 }))
    .filter((p) => p.y > 0)
}
