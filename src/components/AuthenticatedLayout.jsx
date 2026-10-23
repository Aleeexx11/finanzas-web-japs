import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { CalendarBlank, ChartPie, Flag, SignOut, TrendDown, TrendUp, Wallet } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/useAuth'

const navigation = [
  { to: '/', label: 'Resumen', icon: ChartPie, end: true },
  { to: '/ingresos', label: 'Ingresos', icon: TrendUp },
  { to: '/egresos', label: 'Egresos', icon: TrendDown },
  { to: '/presupuestos', label: 'Presupuestos', icon: ChartPie },
  { to: '/metas', label: 'Metas', icon: Flag },
  { to: '/programados', label: 'Programados', icon: CalendarBlank },
]

export function AuthenticatedLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [signingOut, setSigningOut] = useState(false)
  const [logoutError, setLogoutError] = useState('')

  async function handleLogout() {
    setSigningOut(true)
    setLogoutError('')

    try {
      await logout()
      navigate('/login', { replace: true })
    } catch {
      setLogoutError('No fue posible cerrar la sesión. Revisa tu conexión e inténtalo de nuevo.')
      setSigningOut(false)
    }
  }

  return (
    <div className="financial-shell min-h-screen font-sans lg:flex">
      <aside className="financial-sidebar flex w-full flex-col gap-4 border-b px-4 py-4 sm:px-6 lg:sticky lg:top-0 lg:h-screen lg:min-h-screen lg:w-64 lg:shrink-0 lg:gap-0 lg:border-b-0 lg:border-r lg:px-6 lg:py-6">
        <Link to="/" className="flex w-fit shrink-0 items-center gap-3 text-sm font-semibold tracking-wide" aria-label="Quetzal, ir al resumen">
          <span className="grid size-10 place-items-center rounded-xl bg-[#103245] text-[#35d9f1]">
            <Wallet size={21} weight="duotone" />
          </span>
          Quetzal
        </Link>

        <p className="mb-3 mt-10 hidden px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-400 lg:block">Mi espacio</p>
        <nav aria-label="Navegación principal" className="grid grid-cols-3 gap-2 lg:block lg:space-y-1">
          {navigation.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1.5 py-2.5 text-center text-[11px] font-medium leading-tight transition sm:text-xs lg:flex-row lg:justify-start lg:gap-3 lg:px-3 lg:text-left lg:text-sm ${
                  isActive
                    ? 'bg-[#103047] text-[#42dff4] ring-1 ring-inset ring-[#1e5367]'
                    : 'text-stone-400 hover:bg-[#102238] hover:text-white'
                }`
              }
            >
              <Icon className="shrink-0" size={19} weight="duotone" />
              <span className="max-w-full truncate">{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="flex min-w-0 items-center justify-between gap-3 border-t border-stone-100 pt-4 lg:mt-auto lg:block lg:pt-5">
          <div className="min-w-0 flex-1 lg:flex-none">
            <p className="hidden px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-400 lg:block">Sesión</p>
            <p className="truncate text-sm font-medium lg:mt-2 lg:px-3" title={user?.name}>{user?.name}</p>
            <p className="truncate text-xs text-stone-500 lg:px-3" title={user?.email}>{user?.email}</p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleLogout}
            disabled={signingOut}
            aria-label={signingOut ? 'Cerrando sesión' : 'Cerrar sesión'}
            title={signingOut ? 'Cerrando sesión' : 'Cerrar sesión'}
            className="mt-0 h-10 w-10 shrink-0 justify-center rounded-xl border-[#243a53] bg-[#102238] px-0 text-sm text-stone-300 sm:w-auto sm:justify-start sm:px-3 lg:mt-4 lg:w-full"
          >
            <SignOut size={17} />
            <span className="hidden sm:inline">{signingOut ? 'Cerrando…' : 'Cerrar sesión'}</span>
          </Button>
        </div>
      </aside>

      <main className="financial-main w-full min-w-0 flex-1 px-4 py-5 sm:px-6 sm:py-7 lg:px-10 lg:py-9">
        {logoutError && (
          <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {logoutError}
          </p>
        )}
        <Outlet />
      </main>
    </div>
  )
}
