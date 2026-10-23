import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ChartPie, CircleNotch, PencilSimple, Plus, Receipt, TrendDown, Trash } from '@phosphor-icons/react'
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { ExpenseFormDialog } from '@/components/ExpenseFormDialog'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DashboardMetricCard } from '@/components/DashboardMetricCard'
import { api } from '@/lib/api'
import { centsToDecimal, decimalToCents } from '@/lib/currency'
import { formatearFecha, formatearMoneda, nombreMes } from '@/lib/formatters'

const MONTHS = Array.from({ length: 12 }, (_, index) => nombreMes(index + 1))

const INITIAL_FILTERS = { anio: String(new Date().getFullYear()), mes: '' }

// Laravel resource collections can be wrapped in `data`; accept either API shape.
function responseRows(response) {
  if (Array.isArray(response)) return response
  if (Array.isArray(response?.data)) return response.data
  return []
}

export default function ExpensePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [filters, setFilters] = useState(() => ({
    anio: searchParams.get('anio') ?? INITIAL_FILTERS.anio,
    mes: searchParams.get('mes') ?? INITIAL_FILTERS.mes,
  }))
  const [appliedFilters, setAppliedFilters] = useState(() => ({
    anio: searchParams.get('anio') ?? INITIAL_FILTERS.anio,
    mes: searchParams.get('mes') ?? INITIAL_FILTERS.mes,
  }))
  const [expenses, setExpenses] = useState([])
  const [listState, setListState] = useState('loading')
  const [listError, setListError] = useState('')
  const [expenseToDelete, setExpenseToDelete] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [deleteError, setDeleteError] = useState('')
  const [editingExpense, setEditingExpense] = useState(null)
  const [formOpen, setFormOpen] = useState(false)

  const metrics = useMemo(() => {
    const total = expenses.reduce((sum, expense) => sum + decimalToCents(expense.monto), 0n)
    const categories = expenses.reduce((totals, expense) => {
      const name = expense.categoria?.nombre ?? 'Sin categoría'
      totals.set(name, (totals.get(name) ?? 0n) + decimalToCents(expense.monto))
      return totals
    }, new Map())
    const topCategory = [...categories.entries()].sort((left, right) => left[1] === right[1] ? 0 : left[1] > right[1] ? -1 : 1)[0]
    const periodLabel = appliedFilters.mes
      ? `${nombreMes(Number(appliedFilters.mes))} ${appliedFilters.anio}`
      : `Año ${appliedFilters.anio}`

    return [
      { title: 'Gastado en el período', description: periodLabel, amount: centsToDecimal(total), icon: TrendDown, tone: 'expense', amountClassName: 'text-rose-300' },
      { title: 'Categoría principal', description: topCategory ? formatearMoneda(centsToDecimal(topCategory[1])) : 'Sin movimientos', displayValue: topCategory?.[0] ?? '—', icon: ChartPie, tone: 'neutral', amountClassName: 'text-violet-300' },
      { title: 'Movimientos', description: 'Egresos en la lista', displayValue: expenses.length.toLocaleString('es-GT'), icon: Receipt, tone: 'neutral' },
    ]
  }, [appliedFilters, expenses])

  // Build the API query from applied filters, keeping an empty month as “all months”.
  const loadExpenses = useCallback(async (queryFilters = appliedFilters) => {
    const query = new URLSearchParams()
    if (queryFilters.anio) query.set('anio', queryFilters.anio)
    if (queryFilters.mes) query.set('mes', queryFilters.mes)
    const suffix = query.size ? `?${query.toString()}` : ''

    setListState('loading')
    setListError('')

    try {
      const rows = responseRows(await api.get(`/egresos${suffix}`))
      setExpenses(rows)
      setListState(rows.length === 0 ? 'empty' : 'success')
    } catch (error) {
      setListError(error.message || 'No fue posible cargar los egresos.')
      setListState('error')
    }
  }, [appliedFilters])

  useEffect(() => {
    loadExpenses(appliedFilters)
  }, [appliedFilters, loadExpenses])

  function updateFilter(event) {
    const { name, value } = event.target
    setFilters((current) => ({ ...current, [name]: value }))
  }

  function applyFilters(event) {
    event.preventDefault()
    setAppliedFilters({ ...filters })
    const query = new URLSearchParams()
    if (filters.anio) query.set('anio', filters.anio)
    if (filters.mes) query.set('mes', filters.mes)
    setSearchParams(query)
  }

  function openEdit(expense) {
    setEditingExpense(expense)
    setFormOpen(true)
  }

  async function deleteExpense() {
    if (!expenseToDelete) return

    setDeletingId(expenseToDelete.id)
    setDeleteError('')

    try {
      await api.delete(`/egresos/${expenseToDelete.id}`)
      const remaining = expenses.filter((expense) => expense.id !== expenseToDelete.id)
      setExpenses(remaining)
      setListState(remaining.length === 0 ? 'empty' : 'success')
      setExpenseToDelete(null)
    } catch (error) {
      setDeleteError(error.message || 'No fue posible eliminar el egreso.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <section>
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow text-violet-300">Movimientos</p>
          <h1 className="page-title mt-2">Egresos</h1>
          <p className="page-description mt-2">Comprende y organiza tus gastos.</p>
        </div>
        <Button
          type="button"
          onClick={() => { setEditingExpense(null); setFormOpen(true) }}
          className="h-10 rounded-xl bg-rose-400 px-4 text-sm font-semibold text-[#241119] hover:bg-rose-300"
        >
          <Plus size={18} />
          Nuevo egreso
        </Button>
      </header>

      <section aria-label="Resumen de egresos" aria-busy={listState === 'loading'} className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map((metric) => <DashboardMetricCard key={metric.title} {...metric} isLoading={listState === 'loading'} />)}
      </section>

      <form onSubmit={applyFilters} className="mt-6 flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-4 sm:flex-row sm:items-end sm:p-5">
        <div className="w-full sm:max-w-36">
          <label htmlFor="expense-year" className="mb-1.5 block text-xs font-medium text-stone-600">Año</label>
          <Input
            id="expense-year"
            name="anio"
            type="number"
            min="1900"
            max="2100"
            value={filters.anio}
            onChange={updateFilter}
            placeholder="Todos"
          />
        </div>
        <div className="w-full sm:max-w-52">
          <label htmlFor="expense-month" className="mb-1.5 block text-xs font-medium text-stone-600">Mes</label>
          <Select id="expense-month" name="mes" value={filters.mes} onChange={updateFilter}>
            <option value="">Todos los meses</option>
            {MONTHS.map((month, index) => <option key={month} value={String(index + 1)}>{month}</option>)}
          </Select>
        </div>
        <Button type="submit" className="h-10 rounded-xl bg-[#26c9e8] px-4 text-sm font-semibold text-[#06202d] hover:bg-[#58def2]">
          Aplicar filtros
        </Button>
      </form>

      <div className="mt-5 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        {listState === 'loading' && (
          <div role="status" aria-live="polite" className="flex min-h-52 flex-col items-center justify-center gap-3 text-sm text-stone-500">
            <CircleNotch size={24} className="animate-spin text-[#28634d]" />
            <span>Cargando egresos…</span>
          </div>
        )}

        {listState === 'error' && (
          <div role="alert" className="flex min-h-52 flex-col items-center justify-center gap-3 px-5 text-center">
            <p className="max-w-lg text-sm text-red-700">{listError}</p>
            <Button type="button" variant="outline" onClick={() => loadExpenses(appliedFilters)} className="h-9 rounded-xl border-stone-200 px-4 text-sm">
              Reintentar
            </Button>
          </div>
        )}

        {listState === 'empty' && (
          <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
            <span className="grid size-12 place-items-center rounded-2xl bg-[#f0f5ec] text-[#28634d]">
              <Receipt size={24} weight="duotone" />
            </span>
            <h2 className="mt-4 font-semibold">Todavía no hay egresos</h2>
            <p className="mt-2 max-w-sm text-sm leading-6 text-slate-400">
              Registra tu primer egreso para este período y aparecerá en esta lista.
            </p>
          </div>
        )}

        {listState === 'success' && (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Fecha</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Subcategoría</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell className="whitespace-nowrap text-stone-600">{formatearFecha(expense.fecha)}</TableCell>
                  <TableCell className="max-w-64 font-medium" title={expense.descripcion}>
                    <span className="block truncate">{expense.descripcion}</span>
                  </TableCell>
                  <TableCell className="text-stone-600">{expense.categoria?.nombre ?? 'Sin categoría'}</TableCell>
                  <TableCell className="text-stone-500">{expense.subcategoria?.nombre ?? '—'}</TableCell>
                  <TableCell className="whitespace-nowrap text-right font-semibold tabular-nums text-rose-300">{formatearMoneda(expense.monto)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Editar egreso: ${expense.descripcion}`}
                        title="Editar"
                        onClick={() => openEdit(expense)}
                        className="rounded-lg text-stone-500 hover:text-[#1d4d3d]"
                      >
                        <PencilSimple size={18} />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Eliminar egreso: ${expense.descripcion}`}
                        title="Eliminar"
                        onClick={() => { setDeleteError(''); setExpenseToDelete(expense) }}
                        className="rounded-lg text-stone-500 hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash size={18} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <ExpenseFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setEditingExpense(null)
        }}
        expense={editingExpense}
        onSuccess={() => loadExpenses(appliedFilters)}
      />

      <AlertDialog.Root
        open={Boolean(expenseToDelete)}
        onOpenChange={(open) => { if (!open && deletingId === null) { setExpenseToDelete(null); setDeleteError('') } }}
      >
        <AlertDialogContent>
          <AlertDialogTitle>¿Eliminar este egreso?</AlertDialogTitle>
          <AlertDialogDescription>
            {expenseToDelete ? `Se eliminará “${expenseToDelete.descripcion}”. Esta acción no se puede deshacer.` : 'Esta acción no se puede deshacer.'}
          </AlertDialogDescription>
          {deleteError && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{deleteError}</p>}
          <div className="mt-6 flex justify-end gap-2">
            <Button type="button" variant="outline" disabled={deletingId !== null} onClick={() => setExpenseToDelete(null)} className="h-10 rounded-xl px-4">Cancelar</Button>
            <Button type="button" variant="destructive" disabled={deletingId !== null} onClick={deleteExpense} className="h-10 rounded-xl px-4">
              {deletingId !== null ? 'Eliminando…' : 'Eliminar egreso'}
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog.Root>
    </section>
  )
}
