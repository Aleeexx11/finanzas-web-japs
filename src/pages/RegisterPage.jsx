import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Eye, EyeSlash } from '@phosphor-icons/react'
import { AuthLayout } from '@/components/AuthLayout'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/useAuth'

function firstError(errors, field) {
  return errors?.[field]?.[0]
}

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', password_confirmation: '' })
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: undefined }))
    setMessage('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setErrors({})
    setMessage('')

    try {
      await register(form)
      navigate('/dashboard', { replace: true })
    } catch (error) {
      setErrors(error.data?.errors ?? {})
      setMessage(error.data?.message ?? error.message ?? 'No fue posible crear la cuenta.')
    } finally {
      setSubmitting(false)
    }
  }

  const nameError = firstError(errors, 'name')
  const emailError = firstError(errors, 'email')
  const passwordError = firstError(errors, 'password')
  const confirmationError = firstError(errors, 'password_confirmation')

  return (
    <AuthLayout
      eyebrow="Empieza con el primer paso"
      title="Crea tu cuenta"
      description="Solo necesitas unos datos para comenzar a ordenar tus finanzas."
      footer={<>¿Ya tienes cuenta? <Link className="font-semibold text-[#25604d] hover:underline" to="/login">Inicia sesión</Link></>}
    >
      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        {message && (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {message}
          </div>
        )}

        <div>
          <label htmlFor="name" className="mb-2 block text-sm font-medium">Nombre</label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            autoFocus
            required
            value={form.name}
            onChange={updateField}
            aria-invalid={Boolean(nameError)}
            aria-describedby={nameError ? 'name-error' : undefined}
            placeholder="Cómo te llamas"
            className="h-11 w-full rounded-xl border border-stone-200 bg-white px-4 text-sm outline-none transition placeholder:text-stone-400 focus:border-[#6d9d79] focus:ring-4 focus:ring-[#6d9d79]/15 aria-invalid:border-red-400"
          />
          {nameError && <p id="name-error" className="mt-1.5 text-xs text-red-600">{nameError}</p>}
        </div>

        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-medium">Correo electrónico</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={form.email}
            onChange={updateField}
            aria-invalid={Boolean(emailError)}
            aria-describedby={emailError ? 'email-error' : undefined}
            placeholder="tu@correo.com"
            className="h-11 w-full rounded-xl border border-stone-200 bg-white px-4 text-sm outline-none transition placeholder:text-stone-400 focus:border-[#6d9d79] focus:ring-4 focus:ring-[#6d9d79]/15 aria-invalid:border-red-400"
          />
          {emailError && <p id="email-error" className="mt-1.5 text-xs text-red-600">{emailError}</p>}
        </div>

        <div>
          <label htmlFor="password" className="mb-2 block text-sm font-medium">Contraseña</label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={form.password}
              onChange={updateField}
              aria-invalid={Boolean(passwordError)}
              aria-describedby={passwordError ? 'password-error' : undefined}
              placeholder="Al menos 8 caracteres"
              className="h-11 w-full rounded-xl border border-stone-200 bg-white px-4 pr-12 text-sm outline-none transition placeholder:text-stone-400 focus:border-[#6d9d79] focus:ring-4 focus:ring-[#6d9d79]/15 aria-invalid:border-red-400"
            />
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              className="absolute inset-y-0 right-0 grid w-12 place-items-center text-stone-400 hover:text-stone-700"
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPassword ? <EyeSlash size={19} /> : <Eye size={19} />}
            </button>
          </div>
          {passwordError && <p id="password-error" className="mt-1.5 text-xs text-red-600">{passwordError}</p>}
        </div>

        <div>
          <label htmlFor="password_confirmation" className="mb-2 block text-sm font-medium">Confirma tu contraseña</label>
          <input
            id="password_confirmation"
            name="password_confirmation"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            required
            value={form.password_confirmation}
            onChange={updateField}
            aria-invalid={Boolean(confirmationError)}
            aria-describedby={confirmationError ? 'confirmation-error' : undefined}
            placeholder="Escríbela nuevamente"
            className="h-11 w-full rounded-xl border border-stone-200 bg-white px-4 text-sm outline-none transition placeholder:text-stone-400 focus:border-[#6d9d79] focus:ring-4 focus:ring-[#6d9d79]/15 aria-invalid:border-red-400"
          />
          {confirmationError && <p id="confirmation-error" className="mt-1.5 text-xs text-red-600">{confirmationError}</p>}
        </div>

        <Button type="submit" disabled={submitting} className="h-12 w-full rounded-xl bg-[#1d4d3d] text-sm font-semibold text-white hover:bg-[#153c30]">
          {submitting ? 'Creando cuenta…' : 'Crear cuenta'}
          {!submitting && <ArrowRight size={18} className="ml-1" />}
        </Button>
      </form>
    </AuthLayout>
  )
}
