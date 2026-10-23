import { useState } from 'react'
import { ArrowUpRight, ChartLineUp, ShieldCheck, TrendDown, TrendUp } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { QuetzalIllustration } from '@/components/QuetzalIllustration'

export function AuthLayout({ eyebrow, title, description, children, footer }) {
  const [coinAccelerated, setCoinAccelerated] = useState(false)

  return (
    <main className="auth-page min-h-screen bg-[#f3f6f0] font-sans text-[#18251f] lg:grid lg:grid-cols-[1fr_0.92fr]">
      <section className="auth-hero-panel auth-hero-enter relative hidden min-h-screen overflow-hidden px-12 py-10 font-sans text-white lg:flex lg:flex-col lg:justify-between xl:px-20">
        <div className="auth-background-orb auth-background-orb-one" aria-hidden="true" />
        <div className="auth-background-orb auth-background-orb-two" aria-hidden="true" />
        <div className="absolute bottom-[-9rem] left-[-5rem] size-[25rem] rounded-full bg-[#a9d6a5]/10 blur-3xl" />

        <div className="auth-finance-scene" role="group" aria-label="Animación financiera interactiva">
          <div className="auth-finance-glow" aria-hidden="true" />
          <div className="auth-finance-ring auth-finance-ring-outer" aria-hidden="true" />
          <div className="auth-finance-ring auth-finance-ring-inner" aria-hidden="true" />
          <div className="auth-quetzal-mascot" aria-hidden="true">
            <QuetzalIllustration />
          </div>
          <button
            type="button"
            className={`auth-coin-button${coinAccelerated ? ' is-accelerated' : ''}`}
            onClick={() => setCoinAccelerated((accelerated) => !accelerated)}
            aria-label={coinAccelerated ? 'Volver al giro normal de la moneda' : 'Acelerar el giro de la moneda'}
            aria-pressed={coinAccelerated}
            title={coinAccelerated ? 'Giro rápido activado' : 'Pulsa para acelerar la moneda'}
          >
            <span className="auth-coin-float" aria-hidden="true">
              <span className="auth-coin">
                <span className="auth-coin-face">Q</span>
                <span className="auth-coin-face auth-coin-face-back">Q</span>
              </span>
            </span>
          </button>
          <div className="auth-finance-chip auth-finance-chip-income" aria-hidden="true">
            <TrendUp size={16} weight="bold" />
            <span>Ingresos</span>
          </div>
          <div className="auth-finance-chip auth-finance-chip-expense" aria-hidden="true">
            <TrendDown size={16} weight="bold" />
            <span>Egresos</span>
          </div>
          <div className="auth-finance-bars" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
        </div>

        <Link to="/login" className="relative z-10 flex w-fit items-center gap-3 text-sm font-semibold tracking-wide text-white">
          <span className="auth-brand-mark grid size-10 place-items-center rounded-xl bg-[#d5f27c] text-[#163b31]" aria-hidden="true">
            <span className="auth-brand-coin">
              <span className="auth-brand-coin-face">Q</span>
              <span className="auth-brand-coin-face auth-brand-coin-face-back">Q</span>
            </span>
          </span>
          <span>
            <span className="block text-[15px] font-bold tracking-[0.04em]">Quetzal</span>
            <span className="mt-0.5 block text-[10px] font-medium tracking-[0.16em] text-white/55">FINANZAS PERSONALES</span>
          </span>
        </Link>

        <div className="relative z-10 max-w-xl pb-12 lg:max-w-[22rem] xl:max-w-md">
          <p className="mb-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#d5f27c]">
            <span className="size-1.5 rounded-full bg-[#d5f27c]" />
            Control financiero personal
          </p>
          <h2 className="max-w-lg text-4xl font-semibold leading-[1.12] tracking-tight xl:text-5xl">
            Dale dirección a cada quetzal.
          </h2>
          <p className="mt-6 max-w-md text-sm leading-7 text-white/65">
            Organiza tus ingresos, egresos y balance mensual desde un solo espacio.
          </p>

          <div className="auth-feature-card mt-10 flex max-w-md items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-sm">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#d5f27c]/15 text-[#d5f27c]">
              <ChartLineUp size={23} weight="duotone" />
            </span>
            <div>
              <p className="text-sm font-medium">Tu panorama, de un vistazo</p>
              <p className="mt-1 text-xs text-white/55">Ingresos, egresos y balance en un solo lugar.</p>
            </div>
            <ArrowUpRight className="ml-auto shrink-0 text-white/45" size={18} />
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2 text-xs text-white/45">
          <ShieldCheck size={16} />
          Tu información financiera se mantiene privada.
        </div>
      </section>

      <section className="auth-right-panel relative flex min-h-screen flex-col overflow-hidden px-5 py-7 sm:px-10 lg:justify-center lg:px-14 xl:px-24">
        <Link to="/login" className="auth-mobile-brand-enter relative z-10 mb-10 flex w-fit items-center gap-2 text-sm font-semibold lg:hidden">
          <span className="auth-brand-mark grid size-9 place-items-center rounded-xl bg-[#163b31] text-[#d5f27c]" aria-hidden="true">
            <span className="auth-brand-coin">
              <span className="auth-brand-coin-face">Q</span>
              <span className="auth-brand-coin-face auth-brand-coin-face-back">Q</span>
            </span>
          </span>
          <span>
            <span className="block text-sm font-bold tracking-wide">Quetzal</span>
            <span className="block text-[9px] font-medium tracking-[0.14em] text-stone-400">FINANZAS PERSONALES</span>
          </span>
        </Link>

        <div className="auth-content-enter relative z-10 mx-auto w-full max-w-md">
          <p className="auth-eyebrow text-xs font-semibold uppercase tracking-[0.2em]">{eyebrow}</p>
          <h1 className="auth-title mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
          <p className="auth-description mt-3 text-sm leading-6">{description}</p>
          <div className="mt-8">{children}</div>
          <div className="auth-footer mt-7 text-sm">{footer}</div>
        </div>

        <p className="relative z-10 mx-auto mt-auto w-full max-w-md pt-12 text-xs text-stone-400 lg:mt-12 lg:pt-0">
          Finanzas claras. Decisiones con propósito.
        </p>
      </section>
    </main>
  )
}
