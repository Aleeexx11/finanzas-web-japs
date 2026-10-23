import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, ArrowUp, ArrowDown, CalendarBlank, ClockCounterClockwise } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { api } from '@/lib/api'
import { centsToDecimal, decimalToCents } from '@/lib/currency'
import { formatearFecha, formatearMoneda } from '@/lib/formatters'

function responseRows(response) {
  if (Array.isArray(response)) return response
  return Array.isArray(response?.data) ? response.data : []
}

function DashboardLowerPanels({ period, summary }) {
  const [incomes, setIncomes] = useState([])
  const [expenses, setExpenses] = useState([])
  const [budgets, setBudgets] = useState([])
  const [scheduled, setScheduled] = useState([])
  const [goals, setGoals] = useState([])

  useEffect(() => {
    let active = true
    const query = new URLSearchParams({ anio: String(period.year), mes: String(period.month) })
    Promise.all([
      api.get(`/ingresos?${query}`),
      api.get(`/egresos?${query}`),
      api.get(`/presupuestos?${query}`),
      api.get('/movimientos-recurrentes?activo=1'),
      api.get('/metas-ahorro'),
    ]).then(([incomeRows, expenseRows, budgetRows, scheduledRows, goalRows]) => {
      if (!active) return
      setIncomes(responseRows(incomeRows))
      setExpenses(responseRows(expenseRows))
      setBudgets(responseRows(budgetRows))
      setScheduled(responseRows(scheduledRows))
      setGoals(responseRows(goalRows))
    }).catch(() => {
      if (!active) return
      setIncomes([])
      setExpenses([])
      setBudgets([])
      setScheduled([])
      setGoals([])
    })
    return () => { active = false }
  }, [period.month, period.year])

  const latestMovements = useMemo(() => [
    ...incomes.map((item) => ({
      id: `i-${item.id}`,
      tipo: 'ingreso',
      fecha: item.fecha,
      concepto: item.fuente,
      categoria: item.categoria?.nombre,
      monto: item.monto,
    })),
    ...expenses.map((item) => ({
      id: `e-${item.id}`,
      tipo: 'egreso',
      fecha: item.fecha,
      concepto: item.descripcion,
      categoria: item.categoria?.nombre,
      monto: item.monto,
    })),
  ].sort((first, second) => second.fecha.localeCompare(first.fecha)).slice(0, 4), [incomes, expenses])

  const totals = budgets.reduce((sum, budget) => ({
    assigned: sum.assigned + decimalToCents(budget.monto_limite),
    spent: sum.spent + decimalToCents(budget.gastado),
    available: sum.available + decimalToCents(budget.disponible),
  }), { assigned: 0n, spent: 0n, available: 0n })

  const periodKey = `${period.year}-${String(period.month).padStart(2, '0')}`
  const pendingForMonth = scheduled.filter((item) => item.proxima_fecha.startsWith(periodKey))
  const pendingExpenses = pendingForMonth
    .filter((item) => item.tipo === 'egreso')
    .reduce((sum, item) => sum + decimalToCents(item.monto), 0n)
  const reserved = goals.reduce((sum, goal) => sum + decimalToCents(goal.monto_ahorrado), 0n)

  return (
    <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(20rem,0.85fr)]">
      <Card className="overflow-hidden border-border bg-card py-0">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border/70 px-5 py-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-base"><ClockCounterClockwise size={18} className="text-[#a88bff]" />Movimientos recientes</CardTitle>
            <CardDescription className="mt-1">{latestMovements.length} movimientos de este período</CardDescription>
          </div>
          <Link to="/ingresos" className="flex items-center gap-1 text-xs font-semibold text-[#35d9f1] hover:text-white">Ver ingresos <ArrowRight size={14} /></Link>
        </CardHeader>
        <CardContent className="p-0">
          {latestMovements.length === 0 ? <p className="px-5 py-9 text-center text-sm text-muted-foreground">No hay movimientos en este período.</p> : latestMovements.map((item) => (
            <div key={item.id} className="flex items-center gap-3 border-b border-border/70 px-5 py-3 last:border-0">
              <span className={`grid size-9 shrink-0 place-items-center rounded-full ${item.tipo === 'ingreso' ? 'bg-emerald-400/15 text-emerald-300' : 'bg-rose-400/15 text-rose-300'}`}>
                {item.tipo === 'ingreso' ? <ArrowUp size={18} /> : <ArrowDown size={18} />}
              </span>
              <span className="w-20 shrink-0 text-xs text-slate-400">{formatearFecha(item.fecha)}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-white">{item.concepto}</span>
                <span className="block truncate text-xs text-slate-400">{item.categoria ?? (item.tipo === 'ingreso' ? 'Ingreso' : 'Egreso')}</span>
              </span>
              <span className={`shrink-0 text-sm font-semibold tabular-nums ${item.tipo === 'ingreso' ? 'text-emerald-300' : 'text-rose-300'}`}>
                {item.tipo === 'ingreso' ? '+' : '−'} {formatearMoneda(item.monto)}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-5">
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <div><CardTitle className="flex items-center gap-2 text-base"><CalendarBlank size={18} className="text-[#35d9f1]" />Presupuesto del mes</CardTitle><CardDescription className="mt-1">{budgets.length} categorías con límite</CardDescription></div>
            <Link to="/presupuestos" className="flex items-center gap-1 text-xs font-semibold text-[#35d9f1] hover:text-white">Ver todo <ArrowRight size={14} /></Link>
          </CardHeader>
          <CardContent>
            {budgets.length === 0 ? <p className="text-sm text-slate-400">Aún no has creado presupuestos.</p> : <>
              <div className="flex items-center justify-between gap-3 text-sm"><p><span className="text-slate-400">{formatearMoneda(centsToDecimal(totals.spent))} </span><span className="text-slate-500">de </span><strong>{formatearMoneda(centsToDecimal(totals.assigned))}</strong></p><strong className="text-[#35d9f1]">{formatearMoneda(centsToDecimal(totals.available))}</strong></div>
              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-[#1b3049]"><div className="h-full rounded-full bg-[#35d9f1]" style={{ width: `${totals.assigned > 0n ? Math.min(100, Number((totals.spent * 10000n) / totals.assigned) / 100) : 0}%` }} /></div>
              <p className="mt-2 text-xs text-slate-400">disponible en total</p>
            </>}
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <div><CardTitle className="text-base">Tu situación</CardTitle><CardDescription className="mt-1">Confirmado, pendiente y reservado</CardDescription></div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div><p className="text-xs text-slate-400">Saldo confirmado</p><p className="mt-1 text-xs text-slate-500">Ingresos menos egresos registrados</p></div>
              <strong className={`shrink-0 text-sm tabular-nums ${decimalToCents(summary?.saldo_actual) < 0n ? 'text-rose-300' : 'text-emerald-300'}`}>{formatearMoneda(summary?.saldo_actual ?? '0.00')}</strong>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
              <div><p className="text-xs text-slate-400">Pagos pendientes</p><p className="mt-1 text-xs text-slate-500">No se descuentan hasta confirmarlos · {pendingForMonth.length} programados</p></div>
              <strong className="shrink-0 text-sm tabular-nums text-rose-300">{formatearMoneda(centsToDecimal(pendingExpenses))}</strong>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
              <div><p className="text-xs text-slate-400">Reservado para metas</p><p className="mt-1 text-xs text-slate-500">{goals.length} metas personales</p></div>
              <Link to="/metas" className="shrink-0 text-sm font-semibold tabular-nums text-violet-300 hover:text-white">{formatearMoneda(centsToDecimal(reserved))}</Link>
            </div>
            <div className="flex justify-end gap-3 border-t border-border pt-3">
              <Link to="/programados" className="flex items-center gap-1 text-xs font-semibold text-[#35d9f1] hover:text-white">Ver agenda <ArrowRight size={14} /></Link>
              <Link to="/metas" className="flex items-center gap-1 text-xs font-semibold text-violet-300 hover:text-white">Ver metas <ArrowRight size={14} /></Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export { DashboardLowerPanels }
