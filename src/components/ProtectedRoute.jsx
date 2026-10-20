import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/useAuth'

function SessionCheck() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f7f7f3] text-sm text-stone-500" aria-live="polite">
      <div className="flex items-center gap-3">
        <span className="size-2 animate-pulse rounded-full bg-[#6d9d79]" />
        Revisando tu sesión…
      </div>
    </main>
  )
}

export function ProtectedRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <SessionCheck />
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />

  return <Outlet />
}

export function PublicRoute() {
  const { user, loading } = useAuth()

  if (loading) return <SessionCheck />
  if (user) return <Navigate to="/" replace />

  return <Outlet />
}
