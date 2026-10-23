import { useCallback, useEffect, useMemo, useState } from 'react'
import { BellRinging, Check, CircleNotch, PencilSimple, Plus, Trash, WarningCircle } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { api } from '@/lib/api'
import { centsToDecimal, decimalToCents } from '@/lib/currency'
import { formatearMoneda, nombreMes } from '@/lib/formatters'

const now = new Date()
const MONTHS = Array.from({ length: 12 }, (_, index) => nombreMes(index + 1))
const YEARS = Array.from({ length: 11 }, (_, index) => now.getFullYear() - index)
const EMPTY_FORM = { categoria_id: '', monto_limite: '', alerta_porcentaje: '80', alerta_activa: true }

function rows(response) {
  if (Array.isArray(response)) return response
  return Array.isArray(response?.data) ? response.data : []
}

function monthStart(year, month) {
  return `${year}-${String(month).padStart(2, '0')}-01`
}

export default function BudgetsPage() {
  const [period, setPeriod] = useState({ year: now.getFullYear(), month: now.getMonth() + 1 })
  const [budgets, setBudgets] = useState([])
  const [categories, setCategories] = useState([])
  const [state, setState] = useState('loading')
  const [error, setError] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [values, setValues] = useState(EMPTY_FORM)
  const [fieldErrors, setFieldErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const loadBudgets = useCallback(async () => {
    setState('loading')
    setError('')
    try {
      const query = new URLSearchParams({ anio: String(period.year), mes: String(period.month) })
      setBudgets(rows(await api.get(`/presupuestos?${query}`)))
      setState('success')
    } catch (requestError) {
      setError(requestError.message || 'No fue posible cargar los presupuestos.')
      setState('error')
    }
  }, [period])

  useEffect(() => { loadBudgets() }, [loadBudgets])

  useEffect(() => {
    let active = true
    api.get('/categorias?tipo=egreso')
      .then((response) => { if (active) setCategories(rows(response)) })
      .catch(() => { if (active) setCategories([]) })
    return () => { active = false }
  }, [])

  const totals = useMemo(() => budgets.reduce((result, budget) => ({
    assigned: result.assigned + decimalToCents(budget.monto_limite),
    spent: result.spent + decimalToCents(budget.gastado),
    available: result.available + decimalToCents(budget.disponible),
  }), { assigned: 0n, spent: 0n, available: 0n }), [budgets])

  function openCreate() {
    setEditing(null)
    setValues({ ...EMPTY_FORM })
    setFieldErrors({})
    setDialogOpen(true)
  }

  function openEdit(budget) {
    setEditing(budget)
    setValues({
      categoria_id: String(budget.categoria_id),
      monto_limite: String(budget.monto_limite),
      alerta_porcentaje: String(budget.alerta_porcentaje ?? 80),
      alerta_activa: Boolean(budget.alerta_activa),
    })
    setFieldErrors({})
    setDialogOpen(true)
  }

  function updateField(event) {
    const { name, value, type, checked } = event.target
    setValues((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
    setFieldErrors((current) => ({ ...current, [name]: undefined }))
  }

  async function saveBudget(event) {
    event.preventDefault()
    setSaving(true)
    setFieldErrors({})
    const payload = {
      categoria_id: values.categoria_id,
      periodo_inicio: monthStart(period.year, period.month),
      monto_limite: values.monto_limite,
      alerta_porcentaje: values.alerta_porcentaje,
      alerta_activa: values.alerta_activa,
    }
    try {
      if (editing) await api.put(`/presupuestos/${editing.id}`, payload)
      else await api.post('/presupuestos', payload)
      setDialogOpen(false)
      await loadBudgets()
    } catch (requestError) {
      if (requestError.data?.errors) setFieldErrors(requestError.data.errors)
      else setError(requestError.message || 'No fue posible guardar el presupuesto.')
    } finally {
      setSaving(false)
    }
  }

  async function removeBudget(budget) {
    setDeletingId(budget.id)
    try {
      await api.delete(`/presupuestos/${budget.id}`)
      setBudgets((current) => current.filter((item) => item.id !== budget.id))
    } catch (requestError) {
      setError(requestError.message || 'No fue posible eliminar el presupuesto.')
    } finally {
      setDeletingId(null)
    }
  }

  const alerts = budgets.filter((budget) => budget.alerta)
  const monthLabel = MONTHS[period.month - 1]

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Planeación mensual</p>
          <h1 className="page-title mt-2">Presupuestos</h1>
          <p className="page-description mt-2">Define límites por categoría y mira cuánto queda disponible.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="grid grid-cols-2 gap-2">
            <Select aria-label="Mes del presupuesto" value={period.month} onChange={(event) => setPeriod((value) => ({ ...value, month: Number(event.target.value) }))}>
              {MONTHS.map((month, index) => <option key={month} value={index + 1}>{month}</option>)}
            </Select>
            <Select aria-label="Año del presupuesto" value={period.year} onChange={(event) => setPeriod((value) => ({ ...value, year: Number(event.target.value) }))}>
              {YEARS.map((year) => <option key={year} value={year}>{year}</option>)}
            </Select>
          </div>
          <Button onClick={openCreate} className="h-11 rounded-xl bg-[#26c9e8] px-4 font-semibold text-[#06202d] hover:bg-[#58def2]">
            <Plus size={18} /> Crear presupuesto
          </Button>
        </div>
      </header>

      {error && <p role="alert" className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Asignado', amount: totals.assigned, tone: 'violet' },
          { label: 'Gastado', amount: totals.spent, tone: 'coral' },
          { label: 'Por utilizar', amount: totals.available, tone: 'cyan' },
        ].map((item) => (
          <Card key={item.label} className="metric-panel">
            <CardContent className="flex items-center gap-4 p-5">
              <span className={`metric-orb metric-orb-${item.tone}`} aria-hidden="true">
                {item.tone === 'violet' ? 'Q' : item.tone === 'coral' ? '↘' : '◷'}
              </span>
              <div className="min-w-0">
                <p className="metric-label">{item.label}</p>
                <p className="metric-value mt-1">{formatearMoneda(centsToDecimal(item.amount))}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_19rem]">
        <Card className="overflow-hidden border-border bg-card py-0">
          <CardHeader className="border-b border-border/70 px-5 py-5 sm:px-6">
            <CardTitle>Tus presupuestos por categoría</CardTitle>
            <CardDescription>{monthLabel} {period.year}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-4 sm:p-5">
            {state === 'loading' && <div className="grid gap-3">{[1, 2, 3].map((key) => <div key={key} className="h-28 animate-pulse rounded-2xl bg-[#14263b]" />)}</div>}
            {state === 'error' && <p className="py-10 text-center text-sm text-rose-300">{error || 'No fue posible cargar los presupuestos.'}</p>}
            {state === 'success' && budgets.length === 0 && (
              <div className="py-12 text-center">
                <p className="font-semibold text-white">Aún no hay límites para {monthLabel.toLocaleLowerCase('es-GT')}.</p>
                <p className="mt-2 text-sm text-slate-400">Crea uno para empezar a controlar tus gastos por categoría.</p>
                <Button onClick={openCreate} className="mt-5 rounded-xl bg-[#26c9e8] text-[#06202d] hover:bg-[#58def2]">Crear presupuesto</Button>
              </div>
            )}
            {state === 'success' && budgets.map((budget) => {
              const percent = Math.min(100, Math.max(0, Number(budget.porcentaje_gastado)))
              const danger = budget.excedido
              const warning = budget.alerta
              return (
                <article key={budget.id} className="budget-row">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold text-white">{budget.categoria}</h3>
                      <p className="mt-1 text-xs text-slate-400">Alerta al {budget.alerta_porcentaje}%</p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button variant="ghost" size="icon" aria-label={`Editar presupuesto de ${budget.categoria}`} onClick={() => openEdit(budget)} className="text-slate-300 hover:bg-[#1b3049] hover:text-white"><PencilSimple size={17} /></Button>
                      <Button variant="ghost" size="icon" aria-label={`Eliminar presupuesto de ${budget.categoria}`} disabled={deletingId === budget.id} onClick={() => removeBudget(budget)} className="text-slate-400 hover:bg-rose-500/10 hover:text-rose-300"><Trash size={17} /></Button>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap justify-between gap-x-4 gap-y-1 text-sm">
                    <p><span className="text-slate-400">Gastado </span><strong className={danger ? 'text-rose-300' : warning ? 'text-amber-300' : 'text-white'}>{formatearMoneda(budget.gastado)}</strong><span className="text-slate-400"> de {formatearMoneda(budget.monto_limite)}</span></p>
                    <p className={decimalToCents(budget.disponible) < 0n ? 'font-semibold text-rose-300' : 'font-semibold text-[#42dff4]'}>{formatearMoneda(budget.disponible)} disponible</p>
                  </div>
                  <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-[#1b3049]">
                    <div className={`h-full rounded-full transition-all ${danger ? 'bg-rose-400' : warning ? 'bg-amber-400' : 'bg-[#35d9f1]'}`} style={{ width: `${percent}%` }} />
                  </div>
                  {warning && <p className={`mt-2 flex items-center gap-1.5 text-xs ${danger ? 'text-rose-300' : 'text-amber-300'}`}><WarningCircle size={14} />{danger ? 'Superaste el límite.' : 'Llegaste al umbral de alerta.'}</p>}
                </article>
              )
            })}
          </CardContent>
        </Card>

        <Card className="h-fit border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BellRinging size={19} className="text-violet-300" />Alertas de presupuesto</CardTitle>
            <CardDescription>Los avisos se activan al llegar al umbral que configuraste.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {state === 'loading' ? <div className="h-20 animate-pulse rounded-xl bg-[#14263b]" /> : alerts.length > 0 ? alerts.map((budget) => (
              <div key={budget.id} className="rounded-xl border border-amber-300/20 bg-amber-300/[0.07] p-3">
                <p className="font-medium text-amber-200">{budget.categoria}</p>
                <p className="mt-1 text-xs text-slate-300">Usaste {formatearMoneda(budget.gastado)} de {formatearMoneda(budget.monto_limite)}.</p>
              </div>
            )) : <p className="text-sm text-slate-400">No tienes alertas activas en {monthLabel.toLocaleLowerCase('es-GT')}.</p>}
            <p className="flex items-start gap-2 border-t border-border pt-4 text-xs leading-5 text-slate-400"><Check size={16} className="mt-0.5 shrink-0 text-emerald-300" />Puedes cambiar el porcentaje de aviso en cada presupuesto.</p>
          </CardContent>
        </Card>
      </div>

      <Dialog.Root open={dialogOpen} onOpenChange={(open) => { if (!saving) setDialogOpen(open) }}>
        <DialogContent className="financial-dialog">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar presupuesto' : 'Crear presupuesto'}</DialogTitle>
            <DialogDescription>El límite se aplica a {monthLabel} {period.year} y solo considera tus egresos.</DialogDescription>
          </DialogHeader>
          <form onSubmit={saveBudget} className="space-y-4">
            <div>
              <label htmlFor="budget-category" className="form-label">Categoría</label>
              <Select id="budget-category" name="categoria_id" value={values.categoria_id} onChange={updateField}>
                <option value="">Selecciona una categoría</option>
                {categories.map((category) => <option key={category.id} value={String(category.id)}>{category.nombre}</option>)}
              </Select>
              {fieldErrors.categoria_id?.map((message) => <p key={message} className="field-error">{message}</p>)}
            </div>
            <div>
              <label htmlFor="budget-limit" className="form-label">Límite mensual (Q)</label>
              <Input id="budget-limit" name="monto_limite" inputMode="decimal" value={values.monto_limite} onChange={updateField} placeholder="0.00" />
              {fieldErrors.monto_limite?.map((message) => <p key={message} className="field-error">{message}</p>)}
            </div>
            <div>
              <label htmlFor="budget-alert" className="form-label">Avisar al llegar a (%)</label>
              <Input id="budget-alert" name="alerta_porcentaje" type="number" min="1" max="100" value={values.alerta_porcentaje} onChange={updateField} />
              {fieldErrors.alerta_porcentaje?.map((message) => <p key={message} className="field-error">{message}</p>)}
            </div>
            <label className="flex items-center justify-between gap-4 rounded-xl border border-border bg-[#101f33] p-3 text-sm">
              <span><span className="block font-medium text-white">Alerta activa</span><span className="mt-1 block text-xs text-slate-400">Mostrar aviso al alcanzar el porcentaje</span></span>
              <input type="checkbox" name="alerta_activa" checked={values.alerta_activa} onChange={updateField} className="size-4 accent-cyan-400" />
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancelar</Button>
              <Button type="submit" disabled={saving || categories.length === 0} className="bg-[#26c9e8] text-[#06202d] hover:bg-[#58def2]">
                {saving && <CircleNotch size={16} className="animate-spin" />}{saving ? 'Guardando…' : 'Guardar presupuesto'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog.Root>
    </section>
  )
}
