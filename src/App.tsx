import { lazy, Suspense, useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import ComboCelebration from './components/ComboCelebration'

const LoginPage = lazy(() => import('./pages/LoginPage'))
const SignUpPage = lazy(() => import('./pages/SignUpPage'))
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'))
const MainPage = lazy(() => import('./pages/MainPage'))
const EntryFormPage = lazy(() => import('./pages/EntryFormPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))

function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Loader2 size={32} className="animate-spin text-red-500" />
    </div>
  )
}

function App() {
  const [showCombo, setShowCombo] = useState(false)

  useEffect(() => {
    (window as any).__triggerCombo = () => {
      setShowCombo(true)
    }
    return () => { delete (window as any).__triggerCombo }
  }, [])

  return (
    <Suspense fallback={<PageLoader />}>
      {showCombo && <ComboCelebration onComplete={() => setShowCombo(false)} />}
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<MainPage />} />
            <Route path="/entry/:date?" element={<EntryFormPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  )
}

export default App
