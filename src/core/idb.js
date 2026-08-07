// Тонкая promise-обёртка над IndexedDB. Без внешних зависимостей.
// Не содержит ссылок на DOM/UI — часть переносимого ядра.

const DB_NAME = 'training-app'
const DB_VERSION = 1
const STORE = 'workouts'

let dbPromise = null

/** Открыть (и при необходимости создать) базу. Возвращает Promise<IDBDatabase>. */
export function openDB() {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' })
        store.createIndex('date', 'date', { unique: false })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return dbPromise
}

function tx(db, mode) {
  return db.transaction(STORE, mode).objectStore(STORE)
}

function toPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

/** Прочитать все записи из хранилища. */
export async function getAll() {
  const db = await openDB()
  return toPromise(tx(db, 'readonly').getAll())
}

/** Прочитать одну запись по id (или undefined). */
export async function get(id) {
  const db = await openDB()
  return toPromise(tx(db, 'readonly').get(id))
}

/** Вставить/перезаписать запись. */
export async function put(value) {
  const db = await openDB()
  const store = tx(db, 'readwrite')
  await toPromise(store.put(value))
  return value
}

/** Удалить запись по id. */
export async function del(id) {
  const db = await openDB()
  await toPromise(tx(db, 'readwrite').delete(id))
}

/** Очистить всё хранилище. */
export async function clear() {
  const db = await openDB()
  await toPromise(tx(db, 'readwrite').clear())
}
