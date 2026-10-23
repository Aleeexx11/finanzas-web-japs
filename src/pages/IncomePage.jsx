import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CalendarBlank, CircleNotch, Coins, PencilSimple, Plus, Receipt, Trash } from '@phosphor-icons/react'
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { IncomeFormDialog } from '@/components/IncomeFormDialog'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DashboardMetricCard } from '@/components/DashboardMetricCard'
import { api } from '@/lib/api'
import { centsToDecimal, decimalToCents } from '@/lib/currency'
import { formatearFecha, formatearMoneda, nombreMes } from '@/lib/formatters'

const MONTHS = Array.from({ length: 12 }, (_, index) => nombreMes(index + 1))

const INITIAL_FILTERS = { anio: String(new Date().getFullYear()), mes: '' }

// Laravel can return a resource collection directly or inside a `data` property.
function responseRows(response) {
  if (Array.isArray(response)) return response
  if (Array.isArray(response?.data)) return response.data
  return []
}

export default function IncomePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [filters, setFilters] = useState(() => ({
    anio: searchParams.get('anio') ?? INITIAL_FILTERS.anio,
    mes: searchParams.get('mes') ?? INITIAL_FILTERS.mes,
  }))
  const [appliedFilters, setAppliedFilters] = useState(() => ({
    anio: searchParams.get('anio') ?? INITIAL_FILTERS.anio,
    mes: searchParams.get('mes') ?? INITIAL_FILTERS.mes,
  }))
  const [incomes, setIncomes] = useState([])
  const [listState, setListState] = useState('loading')
  const [listError, setListError] = useState('')
  const [incomeToDelete, setIncomeToDelete] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [deleteError, setDeleteError] = useState('')
  const [editingIncome, setEditingIncome] = useState(null)
  const [formOpen, setFormOpen] = useState(false)

  const metrics = useMemo(() => {
    const total = incomes.reduce((sum, income) => sum + decimalToCents(income.monto), 0n)
    const count = BigInt(incomes.length)
    const average = count > 0n ? (total + (count / 2n)) / count : 0n
    const periodLabel = appliedFilters.mes
      ? `${nombreMes(Number(appliedFilters.mes))} ${appliedFilters.anio}`
      : `Año ${appliedFilters.anio}`

    return [
      { title: 'Total del período', description: periodLabel, amount: centsToDecimal(total), icon: Coins, tone: 'income', amountClassName: 'text-emerald-300' },
      { title: 'Promedio por ingreso', description: 'Monto promedio registrado', amount: centsToDecimal(average), icon: CalendarBlank, tone: 'neutral', amountClassName: 'text-cyan-300' },
      { title: 'Registros', description: 'Movimientos en la lista', displayValue: incomes.length.toLocaleString('es-GT'), icon: Receipt, tone: 'neutral' },
    ]
  }, [appliedFilters, incomes])

  // Send only selected filters; an empty month means that all months are included.
  const loadIncomes = useCallback(async (queryFilters = appliedFilters) => {
    const query = new URLSearchParams()
    if (queryFilters.anio) query.set('anio', queryFilters.anio)
    if (queryFilters.mes) query.set('mes', queryFilters.mes)
    const suffix = query.size ? `?${query.toString()}` : ''

    setListState('loading')
    setListError('')

    try {
      // The Laravel resource is registered at /api/ingresos.
      const rows = responseRows(await api.get(`/ingresos${suffix}`))
      setIncomes(rows)
      setListState(rows.length === 0 ? 'empty' : 'success')
    } catch (error) {
      setListError(error.message || 'No fue posible cargar los ingresos.')
      setListState('error')
    }
  }, [appliedFilters])

  useEffect(() => {
    loadIncomes(appliedFilters)
  }, [appliedFilters, loadIncomes])

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

  function openEdit(income) {
    setEditingIncome(income)
    setFormOpen(true)
  }

  async function deleteIncome() {
    if (!incomeToDelete) return

    setDeletingId(incomeToDelete.id)
    setDeleteError('')

    try {
      await api.delete(`/ingresos/${incomeToDelete.id}`)
      const remaining = incomes.filter((income) => income.id !== incomeToDelete.id)
      setIncomes(remaining)
      setListState(remaining.length === 0 ? 'empty' : 'success')
      setIncomeToDelete(null)
    } catch (error) {
      setDeleteError(error.message || 'No fue posible eliminar el ingreso.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <section>
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Movimientos</p>
          <h1 className="page-title mt-2">Ingresos</h1>
          <p className="page-description mt-2">Organiza el dinero que recibes.</p>
        </div>
        <Button
          type="button"
          onClick={() => { setEditingIncome(null); setFormOpen(true) }}
          className="h-10 rounded-xl bg-[#26c9e8] px-4 text-sm font-semibold text-[#06202d] hover:bg-[#58def2]"
        >
          <Plus size={18} />
          Nuevo ingreso
        </Button>
      </header>

      <section aria-label="Resumen de ingresos" aria-busy={listState === 'loading'} className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map((metric) => <DashboardMetricCard key={metric.title} {...metric} isLoading={listState === 'loading'} />)}
      </section>

      <form onSubmit={applyFilters} className="mt-6 flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-4 sm:flex-row sm:items-end sm:p-5">
        <div className="w-full sm:max-w-36">
          <label htmlFor="income-year" className="mb-1.5 block text-xs font-medium text-stone-600">Año</label>
          <Input
            id="income-year"
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
          <label htmlFor="income-month" className="mb-1.5 block text-xs font-medium text-stone-600">Mes</label>
          <Select id="income-month" name="mes" value={filters.mes} onChange={updateFilter}>
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
            <span>Cargando ingresos…</span>
          </div>
        )}

        {listState === 'error' && (
          <div role="alert" className="flex min-h-52 flex-col items-center justify-center gap-3 px-5 text-center">
            <p className="max-w-lg text-sm text-red-700">{listError}</p>
            <Button type="button" variant="outline" onClick={() => loadIncomes(appliedFilters)} className="h-9 rounded-xl border-stone-200 px-4 text-sm">
              Reintentar
            </Button>
          </div>
        )}

        {listState === 'empty' && (
          <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
            <span className="grid size-12 place-items-center rounded-2xl bg-[#f0f5ec] text-[#28634d]">
              <Coins size={24} weight="duotone" />
            </span>
            <h2 className="mt-4 font-semibold">Todavía no hay ingresos</h2>
            <p className="mt-2 max-w-sm text-sm leading-6 text-slate-400">
              Registra tu primer ingreso para este período y aparecerá en esta lista.
            </p>
            <Button
              type="button"
              onClick={() => { setEditingIncome(null); setFormOpen(true) }}
              className="mt-4 h-9 rounded-xl bg-[#26c9e8] px-4 text-sm font-semibold text-[#06202d] hover:bg-[#58def2]"
            >
              <Plus size={16} />
              Crear primer ingreso
            </Button>
          </div>
        )}

        {listState === 'success' && (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Fecha</TableHead>
                <TableHead>Fuente</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incomes.map((income) => (
                <TableRow key={income.id}>
                  <TableCell className="whitespace-nowrap text-stone-600">{formatearFecha(income.fecha)}</TableCell>
                  <TableCell className="max-w-64 font-medium" title={income.fuente}>
                    <span className="block truncate">{income.fuente}</span>
                  </TableCell>
                  <TableCell className="text-stone-600">{income.categoria?.nombre ?? 'Sin categoría'}</TableCell>
                  <TableCell className="whitespace-nowrap text-right font-semibold tabular-nums text-emerald-300">{formatearMoneda(income.monto)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Editar ingreso: ${income.fuente}`}
                        title="Editar"
                        onClick={() => openEdit(income)}
                        className="rounded-lg text-stone-500 hover:text-[#1d4d3d]"
                      >
                        <PencilSimple size={18} />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Eliminar ingreso: ${income.fuente}`}
                        title="Eliminar"
                        onClick={() => { setDeleteError(''); setIncomeToDelete(income) }}
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

      <IncomeFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setEditingIncome(null)
        }}
        income={editingIncome}
        onSuccess={() => loadIncomes(appliedFilters)}
      />

      <AlertDialog.Root
        open={Boolean(incomeToDelete)}
        onOpenChange={(open) => { if (!open && deletingId === null) { setIncomeToDelete(null); setDeleteError('') } }}
      >
        <AlertDialogContent>
          <AlertDialogTitle>¿Eliminar este ingreso?</AlertDialogTitle>
          <AlertDialogDescription>
            {incomeToDelete ? `Se eliminará “${incomeToDelete.fuente}”. Esta acción no se puede deshacer.` : 'Esta acción no se puede deshacer.'}
          </AlertDialogDescription>
          {deleteError && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{deleteError}</p>}
          <div className="mt-6 flex justify-end gap-2">
            <Button type="button" variant="outline" disabled={deletingId !== null} onClick={() => setIncomeToDelete(null)} className="h-10 rounded-xl px-4">Cancelar</Button>
            <Button type="button" variant="destructive" disabled={deletingId !== null} onClick={deleteIncome} className="h-10 rounded-xl px-4">
              {deletingId !== null ? 'Eliminando…' : 'Eliminar ingreso'}
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog.Root>
    </section>
  )
}
