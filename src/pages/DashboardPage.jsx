import { useEffect, useMemo, useState } from 'react'
import { CalendarBlank, ChartLineUp, TrendDown, TrendUp, Wallet } from '@phosphor-icons/react'
import { useAuth } from '@/context/useAuth'
import { DashboardMetricCard } from '@/components/DashboardMetricCard'
import { Select } from '@/components/ui/select'
import { api } from '@/lib/api'

const now = new Date()
const selectedYear = now.getFullYear()
const currentMonth = now.getMonth() + 1
const monthOptions = Array.from({ length: 12 }, (_, index) => {
  const monthName = new Intl.DateTimeFormat('es-GT', { month: 'long' }).format(new Date(2020, index, 1))
  return {
    value: index + 1,
    label: monthName.charAt(0).toLocaleUpperCase('es-GT') + monthName.slice(1),
  }
})

function getMonthName(month) {
  return monthOptions.find((option) => option.value === month)?.label ?? ''
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [month, setMonth] = useState(currentMonth)
  const [summary, setSummary] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    const query = new URLSearchParams({ anio: String(selectedYear), mes: String(month) })

    setIsLoading(true)
    setError('')
    setSummary(null)

    api.get(`/dashboard/resumen?${query.toString()}`)
      .then((data) => {
        if (active) setSummary(data)
      })
      .catch(() => {
        if (active) setError('No fue posible cargar el resumen. Revisa tu conexión e inténtalo de nuevo.')
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [month])

  const metrics = useMemo(() => {
    const monthName = getMonthName(month)
    const balance = String(summary?.balance_mes ?? '0.00')
    const hasNonZeroDigits = /[1-9]/.test(balance)
    const isPositiveBalance = !balance.startsWith('-') && hasNonZeroDigits
    const isNegativeBalance = balance.startsWith('-') && hasNonZeroDigits

    return [
      {
        title: 'Ingresos del mes',
        description: monthName,
        amount: summary?.ingresos_mes,
        icon: TrendUp,
        tone: 'income',
      },
      {
        title: 'Egresos del mes',
        description: monthName,
        amount: summary?.egresos_mes,
        icon: TrendDown,
        tone: 'expense',
      },
      {
        title: 'Balance del mes',
        description: monthName,
        amount: summary?.balance_mes,
        icon: Wallet,
        tone: 'neutral',
        amountClassName: isPositiveBalance
          ? 'text-emerald-700'
          : isNegativeBalance
            ? 'text-rose-700'
            : 'text-[#18251f]',
      },
      {
        title: 'Acumulado del año',
        description: `Hasta ${monthName.toLocaleLowerCase('es-GT')} · ${selectedYear}`,
        amount: summary?.balance_acumulado,
        icon: ChartLineUp,
        tone: 'neutral',
      },
    ]
  }, [month, summary])

  return (
    <>
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#65816f]">Resumen</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Hola, {user?.name}</h1>
          <p className="mt-2 text-sm text-stone-500">Este es tu espacio para llevar tus finanzas con claridad.</p>
        </div>

        <label className="flex w-full items-center gap-3 sm:w-auto">
          <CalendarBlank className="shrink-0 text-[#65816f]" size={19} aria-hidden="true" />
          <span className="sr-only">Selecciona el mes del resumen</span>
          <Select
            value={month}
            onChange={(event) => setMonth(Number(event.target.value))}
            aria-label="Mes del resumen"
            className="w-full min-w-44 sm:w-48"
          >
            {monthOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </Select>
        </label>
      </header>

      {error && (
        <p role="alert" className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      )}

      <section aria-label="Resumen financiero" aria-busy={isLoading} className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <DashboardMetricCard
            key={metric.title}
            {...metric}
            isLoading={isLoading}
          />
        ))}
      </section>
    </>
  )
}
