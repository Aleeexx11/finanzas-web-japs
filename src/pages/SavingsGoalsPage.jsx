import { useCallback, useEffect, useMemo, useState } from 'react'
import { CircleNotch, Flag, PencilSimple, Plus, Trash } from '@phosphor-icons/react'
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DashboardMetricCard } from '@/components/DashboardMetricCard'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'
import { centsToDecimal, decimalToCents } from '@/lib/currency'
import { formatearFecha, formatearMoneda } from '@/lib/formatters'

const EMPTY_FORM = { nombre: '', monto_objetivo: '', monto_ahorrado: '0.00', fecha_objetivo: '' }

function responseRows(response) {
  if (Array.isArray(response)) return response
  return Array.isArray(response?.data) ? response.data : []
}

export default function SavingsGoalsPage() {
  const [goals, setGoals] = useState([])
  const [state, setState] = useState('loading')
  const [error, setError] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [values, setValues] = useState(EMPTY_FORM)
  const [fieldErrors, setFieldErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [goalToDelete, setGoalToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const loadGoals = useCallback(async () => {
    setState('loading')
    setError('')
    try {
      setGoals(responseRows(await api.get('/metas-ahorro')))
      setState('success')
    } catch (requestError) {
      setError(requestError.message || 'No fue posible cargar tus metas.')
      setState('error')
    }
  }, [])

  useEffect(() => { loadGoals() }, [loadGoals])

  const totals = useMemo(() => goals.reduce((total, goal) => ({
    target: total.target + decimalToCents(goal.monto_objetivo),
    saved: total.saved + decimalToCents(goal.monto_ahorrado),
  }), { target: 0n, saved: 0n }), [goals])

  function openCreate() {
    setEditing(null)
    setValues({ ...EMPTY_FORM })
    setFieldErrors({})
    setDialogOpen(true)
  }

  function openEdit(goal) {
    setEditing(goal)
    setValues({
      nombre: goal.nombre,
      monto_objetivo: String(goal.monto_objetivo),
      monto_ahorrado: String(goal.monto_ahorrado),
      fecha_objetivo: goal.fecha_objetivo ?? '',
    })
    setFieldErrors({})
    setDialogOpen(true)
  }

  function updateField(event) {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
    setFieldErrors((current) => ({ ...current, [name]: undefined }))
  }

  async function saveGoal(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setFieldErrors({})
    const payload = {
      ...values,
      fecha_objetivo: values.fecha_objetivo || null,
    }
    try {
      if (editing) await api.put(`/metas-ahorro/${editing.id}`, payload)
      else await api.post('/metas-ahorro', payload)
      setDialogOpen(false)
      await loadGoals()
    } catch (requestError) {
      if (requestError.data?.errors) setFieldErrors(requestError.data.errors)
      else setError(requestError.message || 'No fue posible guardar la meta.')
    } finally {
      setSaving(false)
    }
  }

  async function deleteGoal() {
    if (!goalToDelete) return
    setDeleting(true)
    try {
      await api.delete(`/metas-ahorro/${goalToDelete.id}`)
      setGoals((current) => current.filter((goal) => goal.id !== goalToDelete.id))
      setGoalToDelete(null)
    } catch (requestError) {
      setError(requestError.message || 'No fue posible eliminar la meta.')
    } finally {
      setDeleting(false)
    }
  }

  const metrics = [
    { title: 'Objetivo total', description: 'Suma de todas tus metas', amount: centsToDecimal(totals.target), icon: Flag, tone: 'neutral', amountClassName: 'text-violet-300' },
    { title: 'Dinero reservado', description: 'Ahorro separado para tus metas', amount: centsToDecimal(totals.saved), icon: Flag, tone: 'income', amountClassName: 'text-emerald-300' },
    { title: 'Metas activas', description: 'Planes personales de ahorro', displayValue: goals.length.toLocaleString('es-GT'), icon: Flag, tone: 'neutral' },
  ]

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Ahorro con propósito</p>
          <h1 className="page-title mt-2">Metas de ahorro</h1>
          <p className="page-description mt-2">Planea una compra, un viaje o tu fondo de emergencia.</p>
        </div>
        <Button onClick={openCreate} className="h-11 rounded-xl bg-[#26c9e8] px-4 font-semibold text-[#06202d] hover:bg-[#58def2]">
          <Plus size={18} /> Crear meta
        </Button>
      </header>

      {error && <p role="alert" className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</p>}

      <section aria-label="Resumen de metas" aria-busy={state === 'loading'} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map((metric) => <DashboardMetricCard key={metric.title} {...metric} isLoading={state === 'loading'} />)}
      </section>

      <Card className="overflow-hidden border-border bg-card py-0">
        <CardHeader className="border-b border-border/70 px-5 py-5 sm:px-6">
          <CardTitle>Tu plan de ahorro</CardTitle>
          <CardDescription>Actualiza el monto separado conforme avances con cada objetivo.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 p-4 sm:p-5">
          {state === 'loading' && <div role="status" className="grid gap-3">{[1, 2].map((key) => <div key={key} className="h-32 animate-pulse rounded-2xl bg-[#14263b]" />)}</div>}
          {state === 'error' && <div className="py-10 text-center"><p className="text-sm text-rose-200">{error}</p><Button onClick={loadGoals} variant="outline" className="mt-4 border-border bg-muted text-white hover:bg-muted/80">Reintentar</Button></div>}
          {state === 'success' && goals.length === 0 && <div className="py-12 text-center"><p className="font-semibold text-white">Aún no tienes metas de ahorro.</p><p className="mt-2 text-sm text-slate-400">Crea una meta para ver cuánto has reservado y cuánto falta.</p><Button onClick={openCreate} className="mt-5 rounded-xl bg-[#26c9e8] text-[#06202d] hover:bg-[#58def2]">Crear primera meta</Button></div>}
          {state === 'success' && goals.map((goal) => {
            const percent = Math.max(0, Number(goal.porcentaje))
            const width = Math.min(100, percent)
            const remaining = decimalToCents(goal.monto_objetivo) - decimalToCents(goal.monto_ahorrado)
            return (
              <article key={goal.id} className="budget-row">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-semibold text-white">{goal.nombre}</h2>
                    <p className="mt-1 text-xs text-slate-400">{goal.fecha_objetivo ? `Fecha objetivo: ${formatearFecha(goal.fecha_objetivo)}` : 'Sin fecha objetivo'}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" aria-label={`Editar meta ${goal.nombre}`} onClick={() => openEdit(goal)} className="text-slate-300 hover:bg-[#1b3049] hover:text-white"><PencilSimple size={17} /></Button>
                    <Button variant="ghost" size="icon" aria-label={`Eliminar meta ${goal.nombre}`} onClick={() => setGoalToDelete(goal)} className="text-slate-400 hover:bg-rose-500/10 hover:text-rose-300"><Trash size={17} /></Button>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm">
                  <p><strong className="text-emerald-300">{formatearMoneda(goal.monto_ahorrado)}</strong><span className="text-slate-400"> de {formatearMoneda(goal.monto_objetivo)}</span></p>
                  <p className="font-semibold text-violet-300">{percent.toLocaleString('es-GT', { maximumFractionDigits: 2 })}%</p>
                </div>
                <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-[#1b3049]"><div className="h-full rounded-full bg-gradient-to-r from-violet-400 to-[#35d9f1] transition-all" style={{ width: `${width}%` }} /></div>
                <p className="mt-2 text-xs text-slate-400">{remaining > 0n ? `Faltan ${formatearMoneda(centsToDecimal(remaining))}` : 'Meta alcanzada'}</p>
              </article>
            )
          })}
        </CardContent>
      </Card>

      <p className="text-xs leading-5 text-slate-500">El dinero reservado es una referencia de planificación. Registrar una meta no genera un egreso ni modifica el saldo confirmado.</p>

      <Dialog.Root open={dialogOpen} onOpenChange={(open) => { if (!saving) setDialogOpen(open) }}>
        <DialogContent className="financial-dialog">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar meta de ahorro' : 'Crear meta de ahorro'}</DialogTitle>
            <DialogDescription>Define cuánto quieres reunir y cuánto has separado hasta ahora.</DialogDescription>
          </DialogHeader>
          <form onSubmit={saveGoal} className="space-y-4">
            <div><label htmlFor="goal-name" className="form-label">Nombre</label><Input id="goal-name" name="nombre" value={values.nombre} onChange={updateField} placeholder="Ej. Fondo de emergencia" />{fieldErrors.nombre?.map((message) => <p key={message} className="field-error">{message}</p>)}</div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label htmlFor="goal-target" className="form-label">Monto objetivo (Q)</label><Input id="goal-target" name="monto_objetivo" inputMode="decimal" value={values.monto_objetivo} onChange={updateField} placeholder="0.00" />{fieldErrors.monto_objetivo?.map((message) => <p key={message} className="field-error">{message}</p>)}</div>
              <div><label htmlFor="goal-saved" className="form-label">Monto reservado (Q)</label><Input id="goal-saved" name="monto_ahorrado" inputMode="decimal" value={values.monto_ahorrado} onChange={updateField} placeholder="0.00" />{fieldErrors.monto_ahorrado?.map((message) => <p key={message} className="field-error">{message}</p>)}</div>
            </div>
            <div><label htmlFor="goal-date" className="form-label">Fecha objetivo (opcional)</label><Input id="goal-date" name="fecha_objetivo" type="date" value={values.fecha_objetivo} onChange={updateField} />{fieldErrors.fecha_objetivo?.map((message) => <p key={message} className="field-error">{message}</p>)}</div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancelar</Button>
              <Button type="submit" disabled={saving} className="bg-[#26c9e8] text-[#06202d] hover:bg-[#58def2]">{saving && <CircleNotch size={16} className="animate-spin" />}{saving ? 'Guardando…' : 'Guardar meta'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog.Root>

      <AlertDialog.Root open={Boolean(goalToDelete)} onOpenChange={(open) => { if (!open && !deleting) setGoalToDelete(null) }}>
        <AlertDialogContent className="financial-dialog">
          <AlertDialogTitle>¿Eliminar esta meta?</AlertDialogTitle>
          <AlertDialogDescription>{goalToDelete ? `Se eliminará “${goalToDelete.nombre}” y su monto reservado dejará de aparecer en el resumen.` : 'Esta acción no se puede deshacer.'}</AlertDialogDescription>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="outline" disabled={deleting} onClick={() => setGoalToDelete(null)}>Cancelar</Button>
            <Button variant="destructive" disabled={deleting} onClick={deleteGoal}>{deleting ? <CircleNotch size={16} className="animate-spin" /> : null}Eliminar meta</Button>
          </div>
        </AlertDialogContent>
      </AlertDialog.Root>
    </section>
  )
}
