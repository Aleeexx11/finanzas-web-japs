import { useCallback, useEffect, useMemo, useState } from 'react'
import { CircleNotch, PencilSimple, Receipt, Trash } from '@phosphor-icons/react'
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { api } from '@/lib/api'

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const EMPTY_FORM = { fecha: '', descripcion: '', monto: '', categoria_id: '', subcategoria_id: '' }
const INITIAL_FILTERS = { anio: String(new Date().getFullYear()), mes: '' }

// Laravel resource collections can be wrapped in `data`; accept either API shape.
function responseRows(response) {
  if (Array.isArray(response)) return response
  if (Array.isArray(response?.data)) return response.data
  return []
}

// Format the decimal string without converting the monetary amount to a float.
function formatQuetzales(amount) {
  const match = /^(-?)(\d+)(?:\.(\d{1,2}))?$/.exec(String(amount ?? '0').trim())
  if (!match) return `Q ${String(amount ?? '0')}`

  const [, sign, integerPart, decimalPart = ''] = match
  const groupedInteger = new Intl.NumberFormat('es-GT').format(BigInt(integerPart))
  return `Q ${sign}${groupedInteger}.${decimalPart.padEnd(2, '0')}`
}

function formatDate(date) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(date ?? ''))
  if (!match) return date || '—'

  const [, year, month, day] = match
  return new Intl.DateTimeFormat('es-GT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(Number(year), Number(month) - 1, Number(day))))
}

export default function ExpensePage() {
  const [filters, setFilters] = useState(INITIAL_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState(INITIAL_FILTERS)
  const [expenses, setExpenses] = useState([])
  const [listState, setListState] = useState('loading')
  const [listError, setListError] = useState('')
  const [expenseToDelete, setExpenseToDelete] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [deleteError, setDeleteError] = useState('')
  const [editingExpense, setEditingExpense] = useState(null)
  const [editForm, setEditForm] = useState(EMPTY_FORM)
  const [editError, setEditError] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)
  const [categories, setCategories] = useState([])
  const [categoryState, setCategoryState] = useState('idle')
  const [categoryError, setCategoryError] = useState('')

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

  // Load accessible expense categories only when an edit dialog is opened.
  const loadCategories = useCallback(async () => {
    setCategoryState('loading')
    setCategoryError('')

    try {
      const response = await api.get('/categorias?tipo=egreso')
      setCategories(responseRows(response))
      setCategoryState('success')
    } catch (error) {
      setCategoryError(error.message || 'No fue posible cargar las categorías.')
      setCategoryState('error')
    }
  }, [])

  useEffect(() => {
    if (editingExpense) loadCategories()
  }, [editingExpense?.id, loadCategories])

  const availableSubcategories = useMemo(() => {
    const selectedCategory = categories.find(
      (category) => String(category.id) === editForm.categoria_id,
    )
    return responseRows(selectedCategory?.subcategorias)
  }, [categories, editForm.categoria_id])

  function updateFilter(event) {
    const { name, value } = event.target
    setFilters((current) => ({ ...current, [name]: value }))
  }

  function applyFilters(event) {
    event.preventDefault()
    setAppliedFilters({ ...filters })
  }

  function openEdit(expense) {
    // Keep amounts as strings so the decimal value is never rounded in JavaScript.
    setEditForm({
      fecha: expense.fecha ?? '',
      descripcion: expense.descripcion ?? '',
      monto: String(expense.monto ?? ''),
      categoria_id: String(expense.categoria_id ?? ''),
      subcategoria_id: String(expense.subcategoria_id ?? ''),
    })
    setEditError('')
    setEditingExpense(expense)
  }

  async function saveExpense(event) {
    event.preventDefault()
    if (!editingExpense) return

    setSavingEdit(true)
    setEditError('')

    try {
      // The API validates these fields in its UpdateEgresoRequest Form Request.
      await api.put(`/egresos/${editingExpense.id}`, {
        fecha: editForm.fecha,
        descripcion: editForm.descripcion.trim(),
        monto: editForm.monto.trim(),
        categoria_id: Number(editForm.categoria_id),
        subcategoria_id: editForm.subcategoria_id ? Number(editForm.subcategoria_id) : null,
      })
      setEditingExpense(null)
      await loadExpenses(appliedFilters)
    } catch (error) {
      const validationMessage = Object.values(error.data?.errors ?? {})
        .flat()
        .find((message) => typeof message === 'string')
      setEditError(validationMessage || error.message || 'No fue posible actualizar el egreso.')
    } finally {
      setSavingEdit(false)
    }
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
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#65816f]">Movimientos</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Egresos</h1>
          <p className="mt-2 text-sm text-stone-500">Consulta y administra tus gastos registrados.</p>
        </div>
      </header>

      <form onSubmit={applyFilters} className="mt-7 flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-4 sm:flex-row sm:items-end sm:p-5">
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
        <Button type="submit" className="h-10 rounded-xl bg-[#1d4d3d] px-4 text-sm text-white hover:bg-[#153c30]">
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
            <p className="mt-2 max-w-sm text-sm leading-6 text-stone-500">
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
                  <TableCell className="whitespace-nowrap text-stone-600">{formatDate(expense.fecha)}</TableCell>
                  <TableCell className="max-w-64 font-medium" title={expense.descripcion}>
                    <span className="block truncate">{expense.descripcion}</span>
                  </TableCell>
                  <TableCell className="text-stone-600">{expense.categoria?.nombre ?? 'Sin categoría'}</TableCell>
                  <TableCell className="text-stone-500">{expense.subcategoria?.nombre ?? '—'}</TableCell>
                  <TableCell className="whitespace-nowrap text-right font-semibold tabular-nums">{formatQuetzales(expense.monto)}</TableCell>
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

      <Dialog.Root open={Boolean(editingExpense)} onOpenChange={(open) => { if (!open && !savingEdit) setEditingExpense(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar egreso</DialogTitle>
            <DialogDescription>Actualiza la información del movimiento y guarda los cambios.</DialogDescription>
          </DialogHeader>

          {categoryState === 'loading' && (
            <p role="status" className="mb-4 flex items-center gap-2 text-sm text-stone-500">
              <CircleNotch size={17} className="animate-spin" /> Cargando categorías…
            </p>
          )}
          {categoryState === 'error' && (
            <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <p>{categoryError}</p>
              <Button type="button" variant="link" onClick={loadCategories} className="mt-1 h-auto px-0 text-red-700">Reintentar</Button>
            </div>
          )}

          <form onSubmit={saveExpense} className="space-y-4">
            <div>
              <label htmlFor="edit-expense-date" className="mb-1.5 block text-sm font-medium">Fecha</label>
              <Input id="edit-expense-date" type="date" required value={editForm.fecha} onChange={(event) => setEditForm((current) => ({ ...current, fecha: event.target.value }))} />
            </div>
            <div>
              <label htmlFor="edit-expense-description" className="mb-1.5 block text-sm font-medium">Descripción</label>
              <Input id="edit-expense-description" required maxLength={150} value={editForm.descripcion} onChange={(event) => setEditForm((current) => ({ ...current, descripcion: event.target.value }))} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="edit-expense-category" className="mb-1.5 block text-sm font-medium">Categoría</label>
                <Select
                  id="edit-expense-category"
                  value={editForm.categoria_id}
                  required
                  disabled={categoryState !== 'success'}
                  onChange={(event) => setEditForm((current) => ({ ...current, categoria_id: event.target.value, subcategoria_id: '' }))}
                >
                  <option value="" disabled>Selecciona una categoría</option>
                  {categories.map((category) => <option key={category.id} value={String(category.id)}>{category.nombre}</option>)}
                </Select>
              </div>
              <div>
                <label htmlFor="edit-expense-subcategory" className="mb-1.5 block text-sm font-medium">Subcategoría</label>
                <Select
                  id="edit-expense-subcategory"
                  value={editForm.subcategoria_id}
                  disabled={categoryState !== 'success' || availableSubcategories.length === 0}
                  onChange={(event) => setEditForm((current) => ({ ...current, subcategoria_id: event.target.value }))}
                >
                  <option value="">Sin subcategoría</option>
                  {availableSubcategories.map((subcategory) => <option key={subcategory.id} value={String(subcategory.id)}>{subcategory.nombre}</option>)}
                </Select>
              </div>
            </div>
            <div>
              <label htmlFor="edit-expense-amount" className="mb-1.5 block text-sm font-medium">Monto (Q)</label>
              <Input id="edit-expense-amount" inputMode="decimal" required value={editForm.monto} onChange={(event) => setEditForm((current) => ({ ...current, monto: event.target.value }))} placeholder="0.00" />
            </div>

            {editError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{editError}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" disabled={savingEdit} onClick={() => setEditingExpense(null)} className="h-10 rounded-xl px-4">Cancelar</Button>
              <Button type="submit" disabled={savingEdit || categoryState !== 'success'} className="h-10 rounded-xl bg-[#1d4d3d] px-4 text-white hover:bg-[#153c30]">
                {savingEdit ? 'Guardando…' : 'Guardar cambios'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog.Root>

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
