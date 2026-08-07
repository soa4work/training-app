import './styles.css'
import { registerSW } from 'virtual:pwa-register'
import { initStorage } from './core/storage.js'
import { route, setNotFound, startRouter, navigate } from './ui/router.js'
import { historyView } from './ui/views/historyView.js'
import { workoutView } from './ui/views/workoutView.js'
import { progressView } from './ui/views/progressView.js'

// Регистрация service worker (автообновление). В dev — no-op.
registerSW({ immediate: true })

// Маршруты
route('#/', historyView)
route('#/workout/:id', workoutView)
route('#/progress', progressView)
setNotFound((root) => {
  navigate('#/')
})

async function boot() {
  await initStorage()
  const root = document.getElementById('app')
  startRouter(root)
}

boot()
