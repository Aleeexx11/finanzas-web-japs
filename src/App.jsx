import { useState } from 'react'
import { ArrowUpRight, SignOut, Wallet } from '@phosphor-icons/react'
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Button } from '@/components/ui/button'
import { AuthProvider } from '@/context/AuthContext'
import { useAuth } from '@/context/useAuth'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'

function DashboardPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [signingOut, setSigningOut] = useState(false)

  async function handleLogout() {
    setSigningOut(true)
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <main className="min-h-screen bg-[#f7f7f3] px-5 py-6 font-sans text-[#18251f] sm:px-10">
      <div className="mx-auto max-w-5xl">
        <header className="flex items-center justify-between border-b border-stone-200 pb-5">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-[#163b31] text-[#d5f27c]">
              <Wallet size={21} weight="duotone" />
            </span>
            <span className="text-sm font-semibold">cuentas claras</span>
          </div>
          <Button type="button" variant="outline" onClick={handleLogout} disabled={signingOut} className="h-10 rounded-xl border-stone-200 bg-white px-3 text-sm">
            <SignOut size={17} />
            {signingOut ? 'Cerrando…' : 'Cerrar sesión'}
          </Button>
        </header>

        <section className="mt-12 rounded-3xl border border-stone-200 bg-white p-7 shadow-sm sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#65816f]">Sesión activa</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Hola, {user?.name}</h1>
          <p className="mt-2 text-sm text-stone-500">{user?.email}</p>
          <div className="mt-8 flex items-start gap-4 rounded-2xl bg-[#f0f5ec] p-5">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-[#28634d]">
              <ArrowUpRight size={20} />
            </span>
            <div>
              <p className="font-medium">Tu espacio está listo</p>
              <p className="mt-1 text-sm leading-6 text-stone-600">La sesión está conectada. Desde aquí puedes continuar con el panel de ingresos y egresos.</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
