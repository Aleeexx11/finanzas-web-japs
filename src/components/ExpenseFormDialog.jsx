import { useEffect, useMemo, useState } from 'react'
import { CircleNotch } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { api } from '@/lib/api'

const EMPTY_FORM = {
  categoria_id: '',
  subcategoria_id: '',
  fecha: '',
  descripcion: '',
  monto: '',
  notas: '',
  recurrente: false,
}

// Laravel resources may wrap collection items in a `data` property.
function responseRows(response) {
  if (Array.isArray(response)) return response
  if (Array.isArray(response?.data)) return response.data
  return []
}

// Keep each property name identical to the backend Form Request field name.
function formValues(expense) {
  if (!expense) return { ...EMPTY_FORM }

  return {
    categoria_id: String(expense.categoria_id ?? ''),
    subcategoria_id: String(expense.subcategoria_id ?? ''),
    fecha: expense.fecha ?? '',
    descripcion: expense.descripcion ?? '',
    monto: String(expense.monto ?? ''),
    notas: expense.notas ?? '',
    recurrente: false,
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

export function ExpenseFormDialog({ open, onOpenChange, expense = null, onSuccess }) {
  const [values, setValues] = useState(EMPTY_FORM)
  const [fieldErrors, setFieldErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [categories, setCategories] = useState([])
  const [categoryState, setCategoryState] = useState('idle')
  const [categoryError, setCategoryError] = useState('')
  const [categoryRetry, setCategoryRetry] = useState(0)
  const [subcategories, setSubcategories] = useState([])
  const [subcategoryState, setSubcategoryState] = useState('idle')
  const [subcategoryError, setSubcategoryError] = useState('')
  const [subcategoryRetry, setSubcategoryRetry] = useState(0)

  // Reset the form whenever the modal opens for a new or existing expense.
  useEffect(() => {
    if (!open) return

    setValues(formValues(expense))
    setFieldErrors({})
    setSubmitError('')
  }, [open, expense?.id])

  // Load only expense categories; cleanup prevents stale responses after closing.
  useEffect(() => {
    if (!open) return undefined

    let active = true
    setCategoryState('loading')
    setCategoryError('')

    api.get('/categorias?tipo=egreso')
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

  // Fetch only the chosen category's subcategories; changing category clears the old choice.
  useEffect(() => {
    if (!open || !values.categoria_id) {
      setSubcategories([])
      setSubcategoryState('idle')
      setSubcategoryError('')
      return undefined
    }

    let active = true
    setSubcategoryState('loading')
    setSubcategoryError('')

    api.get(`/categorias/${values.categoria_id}/subcategorias`)
      .then((response) => {
        if (!active) return
        setSubcategories(responseRows(response))
        setSubcategoryState('success')
      })
      .catch((error) => {
        if (!active) return
        setSubcategoryError(error.message || 'No fue posible cargar las subcategorías.')
        setSubcategoryState('error')
      })

    return () => { active = false }
  }, [open, values.categoria_id, subcategoryRetry])

  const selectedCategoryName = useMemo(
    () => categories.find((category) => String(category.id) === values.categoria_id)?.nombre,
    [categories, values.categoria_id],
  )

  function updateField(event) {
    const { name, value, type, checked } = event.target
    setValues((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
    setFieldErrors((current) => ({ ...current, [name]: undefined }))
    setSubmitError('')
  }

  function updateCategory(event) {
    const categoria_id = event.target.value
    setValues((current) => ({ ...current, categoria_id, subcategoria_id: '' }))
    setFieldErrors((current) => ({
      ...current,
      categoria_id: undefined,
      subcategoria_id: undefined,
    }))
    setSubcategories([])
    setSubcategoryError('')
    setSubmitError('')
  }

  async function submitForm(event) {
    event.preventDefault()
    setIsSubmitting(true)
    setFieldErrors({})
    setSubmitError('')

    // Submit raw field values; Laravel remains the source of validation rules.
    const payload = {
      categoria_id: values.categoria_id,
      subcategoria_id: values.subcategoria_id || null,
      fecha: values.fecha,
      descripcion: values.descripcion,
      monto: values.monto,
      notas: values.notas || null,
      recurrente: values.recurrente,
    }

    try {
      const response = expense
        ? await api.put(`/egresos/${expense.id}`, payload)
        : await api.post('/egresos', payload)

      onOpenChange(false)
      await onSuccess?.(response)
    } catch (error) {
      // Laravel sends validation errors as { errors: { field: [messages] } }.
      const errors = error.data?.errors
      if (errors && typeof errors === 'object') {
        setFieldErrors(errors)
      } else {
        setSubmitError(error.data?.message || error.message || 'No fue posible guardar el egreso.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const isEditing = Boolean(expense)
  const categoriesLoading = categoryState === 'loading'
  const subcategoriesLoading = subcategoryState === 'loading'

  return (
    <Dialog.Root open={open} onOpenChange={(nextOpen) => { if (!isSubmitting) onOpenChange(nextOpen) }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar egreso' : 'Crear egreso'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Actualiza los datos del movimiento.' : 'Completa los datos para registrar un nuevo movimiento.'}
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
            <label htmlFor="egreso-categoria" className="mb-1.5 block text-sm font-medium">Categoría</label>
            <Select
              id="egreso-categoria"
              name="categoria_id"
              value={values.categoria_id}
              onChange={updateCategory}
              disabled={categoriesLoading || categoryState !== 'success'}
              aria-invalid={fieldMessages(fieldErrors, 'categoria_id').length > 0}
              aria-describedby="egreso-categoria-error"
            >
              <option value="">{categoriesLoading ? 'Cargando categorías…' : 'Selecciona una categoría'}</option>
              {categories.map((category) => (
                <option key={category.id} value={String(category.id)}>{category.nombre}</option>
              ))}
            </Select>
            <FieldErrors id="egreso-categoria-error" messages={fieldMessages(fieldErrors, 'categoria_id')} />
          </div>

          <div>
            <label htmlFor="egreso-subcategoria" className="mb-1.5 block text-sm font-medium">Subcategoría</label>
            <Select
              id="egreso-subcategoria"
              name="subcategoria_id"
              value={values.subcategoria_id}
              onChange={updateField}
              disabled={!values.categoria_id || subcategoriesLoading || subcategoryState !== 'success'}
              aria-invalid={fieldMessages(fieldErrors, 'subcategoria_id').length > 0}
              aria-describedby="egreso-subcategoria-error egreso-subcategoria-status"
            >
              <option value="">Sin subcategoría</option>
              {subcategories.map((subcategory) => (
                <option key={subcategory.id} value={String(subcategory.id)}>{subcategory.nombre}</option>
              ))}
            </Select>
            <FieldErrors id="egreso-subcategoria-error" messages={fieldMessages(fieldErrors, 'subcategoria_id')} />
            <p id="egreso-subcategoria-status" className="mt-1 text-xs text-stone-500" aria-live="polite">
              {subcategoriesLoading && 'Cargando subcategorías…'}
              {subcategoryState === 'success' && subcategories.length === 0 && `“${selectedCategoryName ?? 'Esta categoría'}” no tiene subcategorías.`}
              {subcategoryState === 'error' && subcategoryError}
            </p>
            {subcategoryState === 'error' && (
              <Button type="button" variant="link" onClick={() => setSubcategoryRetry((count) => count + 1)} className="mt-1 h-auto px-0 text-xs">
                Reintentar carga de subcategorías
              </Button>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="egreso-fecha" className="mb-1.5 block text-sm font-medium">Fecha</label>
              <Input
                id="egreso-fecha"
                name="fecha"
                type="date"
                value={values.fecha}
                onChange={updateField}
                aria-invalid={fieldMessages(fieldErrors, 'fecha').length > 0}
                aria-describedby="egreso-fecha-error"
              />
              <FieldErrors id="egreso-fecha-error" messages={fieldMessages(fieldErrors, 'fecha')} />
            </div>
            <div>
              <label htmlFor="egreso-monto" className="mb-1.5 block text-sm font-medium">Monto (Q)</label>
              <Input
                id="egreso-monto"
                name="monto"
                inputMode="decimal"
                value={values.monto}
                onChange={updateField}
                placeholder="0.00"
                aria-invalid={fieldMessages(fieldErrors, 'monto').length > 0}
                aria-describedby="egreso-monto-error"
              />
              <FieldErrors id="egreso-monto-error" messages={fieldMessages(fieldErrors, 'monto')} />
            </div>
          </div>

          <div>
            <label htmlFor="egreso-descripcion" className="mb-1.5 block text-sm font-medium">Descripción</label>
            <Input
              id="egreso-descripcion"
              name="descripcion"
              value={values.descripcion}
              onChange={updateField}
              aria-invalid={fieldMessages(fieldErrors, 'descripcion').length > 0}
              aria-describedby="egreso-descripcion-error"
            />
            <FieldErrors id="egreso-descripcion-error" messages={fieldMessages(fieldErrors, 'descripcion')} />
          </div>

          <div>
            <label htmlFor="egreso-notas" className="mb-1.5 block text-sm font-medium">Notas <span className="font-normal text-stone-400">(opcional)</span></label>
            <Textarea
              id="egreso-notas"
              name="notas"
              rows={3}
              value={values.notas}
              onChange={updateField}
              aria-invalid={fieldMessages(fieldErrors, 'notas').length > 0}
              aria-describedby="egreso-notas-error"
            />
            <FieldErrors id="egreso-notas-error" messages={fieldMessages(fieldErrors, 'notas')} />
          </div>

          {!isEditing && (
            <label className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 p-3 text-sm">
              <input type="checkbox" name="recurrente" checked={values.recurrente} onChange={updateField} className="size-4 accent-cyan-400" />
              <span><span className="block font-medium">Repetir cada mes</span><span className="text-xs text-muted-foreground">Se programará para el mes siguiente.</span></span>
            </label>
          )}

          {submitError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{submitError}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => onOpenChange(false)} className="h-10 rounded-xl px-4">
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || categoriesLoading || subcategoriesLoading} className="h-10 min-w-36 rounded-xl bg-[#26c9e8] px-4 font-semibold text-[#06202d] hover:bg-[#58def2]">
              {isSubmitting && <CircleNotch size={16} className="animate-spin" />}
              {isSubmitting ? 'Guardando…' : isEditing ? 'Guardar cambios' : 'Crear egreso'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog.Root>
  )
}
