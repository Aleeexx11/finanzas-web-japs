import { useEffect, useState } from 'react'
import { CircleNotch } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { api } from '@/lib/api'

const EMPTY_FORM = {
  categoria_id: '',
  fecha: '',
  fuente: '',
  monto: '',
  notas: '',
}

// Accept either plain arrays or Laravel resource collection responses.
function responseRows(response) {
  if (Array.isArray(response)) return response
  if (Array.isArray(response?.data)) return response.data
  return []
}

function formValues(income) {
  if (!income) return { ...EMPTY_FORM }

  return {
    categoria_id: String(income.categoria_id ?? ''),
    fecha: income.fecha ?? '',
    fuente: income.fuente ?? '',
    monto: String(income.monto ?? ''),
    notas: income.notas ?? '',
  }
}

function fieldMessages(errors, field) {
  const messages = errors?.[field]
  if (Array.isArray(messages)) return messages
  return typeof messages === 'string' ? [messages] : []
}

function FieldErrors({ id, messages }) {
  if (messages.length === 0) return null

  return (
    <ul id={id} className="mt-1.5 space-y-1 text-xs text-red-700" role="alert">
      {messages.map((message, index) => <li key={`${id}-${index}`}>{message}</li>)}
    </ul>
  )
}

export function IncomeFormDialog({ open, onOpenChange, income = null, onSuccess }) {
  const [values, setValues] = useState(EMPTY_FORM)
  const [fieldErrors, setFieldErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [categories, setCategories] = useState([])
  const [categoryState, setCategoryState] = useState('idle')
  const [categoryError, setCategoryError] = useState('')
  const [categoryRetry, setCategoryRetry] = useState(0)

  // Reset the form when the dialog opens for a new or existing income.
  useEffect(() => {
    if (!open) return

    setValues(formValues(income))
    setFieldErrors({})
    setSubmitError('')
  }, [open, income?.id])

  // Load only income categories and ignore late responses after the dialog closes.
  useEffect(() => {
    if (!open) return undefined

    let active = true
    setCategoryState('loading')
    setCategoryError('')

    api.get('/categorias?tipo=ingreso')
      .then((response) => {
        if (!active) return
        setCategories(responseRows(response))
        setCategoryState('success')
      })
      .catch((error) => {
        if (!active) return
        setCategoryError(error.message || 'No fue posible cargar las categorías.')
        setCategoryState('error')
      })

    return () => { active = false }
  }, [open, categoryRetry])

  function updateField(event) {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
    setFieldErrors((current) => ({ ...current, [name]: undefined }))
    setSubmitError('')
  }

  async function submitForm(event) {
    event.preventDefault()
    setIsSubmitting(true)
    setFieldErrors({})
    setSubmitError('')

    // Keep payload keys aligned with the Laravel income form requests.
    const payload = {
      categoria_id: values.categoria_id,
      fecha: values.fecha,
      fuente: values.fuente,
      monto: values.monto,
      notas: values.notas || null,
    }

    try {
      const response = income
        ? await api.put(`/ingresos/${income.id}`, payload)
        : await api.post('/ingresos', payload)

      onOpenChange(false)
      await onSuccess?.(response)
    } catch (error) {
      // Laravel validation responses include field-specific messages under `errors`.
      const errors = error.data?.errors
      if (errors && typeof errors === 'object') {
        setFieldErrors(errors)
      } else {
        setSubmitError(error.data?.message || error.message || 'No fue posible guardar el ingreso.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const isEditing = Boolean(income)
  const categoriesLoading = categoryState === 'loading'

  return (
    <Dialog.Root open={open} onOpenChange={(nextOpen) => { if (!isSubmitting) onOpenChange(nextOpen) }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar ingreso' : 'Crear ingreso'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Actualiza los datos del ingreso.' : 'Completa los datos para registrar un ingreso.'}
          </DialogDescription>
        </DialogHeader>

        {categoryState === 'error' && (
          <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <p>{categoryError}</p>
            <Button type="button" variant="link" onClick={() => setCategoryRetry((count) => count + 1)} className="mt-1 h-auto px-0 text-red-700">
              Reintentar carga de categorías
            </Button>
          </div>
        )}

        <form onSubmit={submitForm} className="space-y-4">
          <div>
            <label htmlFor="ingreso-categoria" className="mb-1.5 block text-sm font-medium">Categoría</label>
            <Select
              id="ingreso-categoria"
              name="categoria_id"
              value={values.categoria_id}
              onChange={updateField}
              disabled={categoriesLoading || categoryState !== 'success'}
              aria-invalid={fieldMessages(fieldErrors, 'categoria_id').length > 0}
              aria-describedby="ingreso-categoria-error"
            >
              <option value="">{categoriesLoading ? 'Cargando categorías…' : 'Selecciona una categoría'}</option>
              {categories.map((category) => (
                <option key={category.id} value={String(category.id)}>{category.nombre}</option>
              ))}
            </Select>
            <FieldErrors id="ingreso-categoria-error" messages={fieldMessages(fieldErrors, 'categoria_id')} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="ingreso-fecha" className="mb-1.5 block text-sm font-medium">Fecha</label>
              <Input
                id="ingreso-fecha"
                name="fecha"
                type="date"
                value={values.fecha}
                onChange={updateField}
                aria-invalid={fieldMessages(fieldErrors, 'fecha').length > 0}
                aria-describedby="ingreso-fecha-error"
              />
              <FieldErrors id="ingreso-fecha-error" messages={fieldMessages(fieldErrors, 'fecha')} />
            </div>
            <div>
              <label htmlFor="ingreso-monto" className="mb-1.5 block text-sm font-medium">Monto (Q)</label>
              <Input
                id="ingreso-monto"
                name="monto"
                inputMode="decimal"
                value={values.monto}
                onChange={updateField}
                placeholder="0.00"
                aria-invalid={fieldMessages(fieldErrors, 'monto').length > 0}
                aria-describedby="ingreso-monto-error"
              />
              <FieldErrors id="ingreso-monto-error" messages={fieldMessages(fieldErrors, 'monto')} />
            </div>
          </div>

          <div>
            <label htmlFor="ingreso-fuente" className="mb-1.5 block text-sm font-medium">Fuente</label>
            <Input
              id="ingreso-fuente"
              name="fuente"
              value={values.fuente}
              onChange={updateField}
              placeholder="Ej. Salario, venta o proyecto"
              aria-invalid={fieldMessages(fieldErrors, 'fuente').length > 0}
              aria-describedby="ingreso-fuente-error"
            />
            <FieldErrors id="ingreso-fuente-error" messages={fieldMessages(fieldErrors, 'fuente')} />
          </div>

          <div>
            <label htmlFor="ingreso-notas" className="mb-1.5 block text-sm font-medium">Notas <span className="font-normal text-stone-400">(opcional)</span></label>
            <Textarea
              id="ingreso-notas"
              name="notas"
              rows={3}
              value={values.notas}
              onChange={updateField}
              aria-invalid={fieldMessages(fieldErrors, 'notas').length > 0}
              aria-describedby="ingreso-notas-error"
            />
            <FieldErrors id="ingreso-notas-error" messages={fieldMessages(fieldErrors, 'notas')} />
          </div>

          {submitError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{submitError}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => onOpenChange(false)} className="h-10 rounded-xl px-4">
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || categoriesLoading || categoryState !== 'success'} className="h-10 min-w-36 rounded-xl bg-[#1d4d3d] px-4 text-white hover:bg-[#153c30]">
              {isSubmitting && <CircleNotch size={16} className="animate-spin" />}
              {isSubmitting ? 'Guardando…' : isEditing ? 'Guardar cambios' : 'Crear ingreso'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog.Root>
  )
}
