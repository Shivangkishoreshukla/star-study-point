import { AdminDashboard, RecoveryPasswordPage } from './pages/AdminDashboard'
import { ClassHome } from './pages/ClassHome'
import HomePage from './pages/HomePage'
import { LearningPage } from './pages/LearningPage'
import type { Grade } from './data/learning'

function App() {
  const currentUrl = new URL(window.location.href)
  const path = currentUrl.pathname.replace(/\/$/, '') || '/'
  const hashParams = new URLSearchParams(currentUrl.hash.slice(1))
  const recoveryType = currentUrl.searchParams.get('type') === 'recovery'
    || hashParams.get('type') === 'recovery'
  const recoveryError = hashParams.has('error_code')
  const recoveryToken = hashParams.has('access_token')
    && hashParams.get('type') !== 'signup'
    && hashParams.get('type') !== 'magiclink'
  if (path === '/admin/reset-password' || recoveryType || recoveryError || recoveryToken) return <RecoveryPasswordPage />
  if (path === '/admin') return <AdminDashboard />
  const classMatch = path.match(/^\/class-(9|10)(?:\/chapter\/([\w-]+))?$/)
  if (classMatch) {
    const grade = Number(classMatch[1]) as Grade
    const chapterId = classMatch[2]
    if (chapterId) return <LearningPage grade={grade} chapterId={chapterId} />
    return <ClassHome grade={grade} />
  }
  return <HomePage />
}

export default App
