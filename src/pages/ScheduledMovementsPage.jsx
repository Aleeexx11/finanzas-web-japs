import { useCallback, useEffect, useState } from 'react'
import { ArrowClockwise, CalendarBlank, CheckCircle, CircleNotch, Pause, Play, Trash } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { api } from '@/lib/api'
import { formatearFecha, formatearMoneda } from '@/lib/formatters'

function responseRows(response) {
  if (Array.isArray(response)) return response
  return Array.isArray(response?.data) ? response.data : []
}

function todayLocal() {
  const today = new Date()
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
}

export default function ScheduledMovementsPage() {
  const [items, setItems] = useState([])
  const [state, setState] = useState('loading')
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [notice, setNotice] = useState('')

  const load = useCallback(async () => {
    setState('loading')
    setError('')
    try {
      setItems(responseRows(await api.get('/movimientos-recurrentes')))
      setState('success')
    } catch (requestError) {
      setError(requestError.message || 'No fue posible cargar las programaciones.')
      setState('error')
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function confirmMovement(item) {
    setBusyId(item.id)
    setError('')
    setNotice('')
    try {
      const result = await api.post(`/movimientos-recurrentes/${item.id}/confirmar`, {})
      setNotice(`Movimiento registrado. La próxima fecha es ${formatearFecha(result.proxima_fecha)}.`)
      await load()
    } catch (requestError) {
      setError(requestError.data?.message || requestError.message || 'No fue posible confirmar el movimiento.')
    } finally {
      setBusyId(null)
    }
  }

  async function toggle(item) {
    setBusyId(item.id)
    setError('')
    try {
      await api.patch(`/movimientos-recurrentes/${item.id}/estado`, { activo: !item.activo })
      setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, activo: !entry.activo } : entry))
    } catch (requestError) {
      setError(requestError.data?.message || requestError.message || 'No fue posible actualizar la programación.')
    } finally {
      setBusyId(null)
    }
  }

  async function remove(item) {
    setBusyId(item.id)
    setError('')
    try {
      await api.delete(`/movimientos-recurrentes/${item.id}`)
      setItems((current) => current.filter((entry) => entry.id !== item.id))
    } catch (requestError) {
      setError(requestError.message || 'No fue posible eliminar la programación.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <section className="space-y-6">
      <header>
        <p className="eyebrow">Ingresos y pagos</p>
        <h1 className="page-title mt-2">Programados</h1>
        <p className="page-description mt-2">Confirma cada movimiento cuando ocurra. Las próximas fechas quedan pendientes hasta entonces.</p>
      </header>

      {notice && <p role="status" className="rounded-xl border border-emerald-300/20 bg-emerald-400/[0.08] px-4 py-3 text-sm text-emerald-200">{notice}</p>}
      {error && <p role="alert" className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</p>}

      <Card className="overflow-hidden border-border bg-card py-0">
        <CardHeader className="border-b border-border/70 px-5 py-5 sm:px-6">
          <CardTitle className="flex items-center gap-2"><CalendarBlank size={19} className="text-[#35d9f1]" />Movimientos recurrentes</CardTitle>
          <CardDescription>Al registrarlos como realizados, se agregan a tus ingresos o egresos confirmados.</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-5">
          {state === 'loading' && <div role="status" className="flex min-h-40 items-center justify-center"><CircleNotch size={26} className="animate-spin text-[#35d9f1]" /></div>}
          {state === 'error' && <div className="py-12 text-center"><p className="text-sm text-rose-200">{error}</p><Button onClick={load} variant="outline" className="mt-4 border-border bg-muted text-white hover:bg-muted/80"><ArrowClockwise size={16} /> Reintentar</Button></div>}
          {state === 'success' && items.length === 0 && <div className="py-12 text-center"><p className="font-medium text-white">No tienes movimientos programados.</p><p className="mt-2 text-sm text-slate-400">Activa “Repetir cada mes” al crear un ingreso o egreso para programar el siguiente.</p></div>}
          {state === 'success' && items.length > 0 && <div className="space-y-3">
            {items.map((item) => {
              const due = item.proxima_fecha <= todayLocal()
              return (
                <article key={item.id} className="scheduled-row">
                  <span className={`scheduled-orb ${item.tipo === 'ingreso' ? 'scheduled-orb-income' : 'scheduled-orb-expense'}`} aria-hidden="true">{item.tipo === 'ingreso' ? '↑' : '↓'}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate font-semibold text-white">{item.concepto}</h2>
                      <span className={`status-pill ${item.activo ? 'status-pill-active' : 'status-pill-paused'}`}>{item.activo ? 'Activo' : 'Pausado'}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">{item.categoria}{item.subcategoria ? ` · ${item.subcategoria}` : ''} · Próximo: {formatearFecha(item.proxima_fecha)}</p>
                  </div>
                  <p className={`scheduled-amount ${item.tipo === 'ingreso' ? 'text-emerald-300' : 'text-rose-300'}`}>{formatearMoneda(item.monto)}</p>
                  <div className="flex shrink-0 items-center gap-1">
                    {due && item.activo && <Button onClick={() => confirmMovement(item)} disabled={busyId === item.id} className="h-9 rounded-lg bg-[#26c9e8] px-3 text-xs font-semibold text-[#06202d] hover:bg-[#58def2]">{busyId === item.id ? <CircleNotch size={15} className="animate-spin" /> : <CheckCircle size={15} />} Confirmar</Button>}
                    {!due && item.activo && <span className="hidden text-xs text-slate-500 sm:inline">Pendiente</span>}
                    <Button variant="ghost" size="icon" onClick={() => toggle(item)} disabled={busyId === item.id} aria-label={item.activo ? 'Pausar programación' : 'Reanudar programación'} className="text-slate-300 hover:bg-[#1b3049] hover:text-white">{item.activo ? <Pause size={17} /> : <Play size={17} />}</Button>
                    <Button variant="ghost" size="icon" onClick={() => remove(item)} disabled={busyId === item.id} aria-label="Eliminar programación" className="text-slate-400 hover:bg-rose-500/10 hover:text-rose-300"><Trash size={17} /></Button>
                  </div>
                </article>
              )
            })}
          </div>}
        </CardContent>
      </Card>
    </section>
  )
}
