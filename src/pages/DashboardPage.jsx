import { ArrowUpRight, ChartPieSlice } from '@phosphor-icons/react'
import { useAuth } from '@/context/useAuth'

export default function DashboardPage() {
  const { user } = useAuth()

  return (
    <>
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#65816f]">Resumen</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Hola, {user?.name}</h1>
        <p className="mt-2 text-sm text-stone-500">Este es tu espacio para llevar tus finanzas con claridad.</p>
      </header>

      <section className="mt-8 rounded-3xl border border-stone-200 bg-white p-7 shadow-sm sm:p-9">
        <span className="grid size-11 place-items-center rounded-xl bg-[#f0f5ec] text-[#28634d]">
          <ChartPieSlice size={22} weight="duotone" />
        </span>
        <h2 className="mt-5 text-xl font-semibold">Tu espacio está listo</h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-stone-600">
          Usa la navegación para consultar tus ingresos y egresos. Aquí podrás ver el resumen de tus movimientos.
        </p>
        <div className="mt-6 flex items-start gap-3 rounded-2xl bg-[#f0f5ec] p-4 text-sm text-[#315c45]">
          <ArrowUpRight size={19} className="mt-0.5 shrink-0" />
          <p>Tu sesión está activa y tus datos se consultan de forma privada.</p>
        </div>
      </section>
    </>
  )
}
