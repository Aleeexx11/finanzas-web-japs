import { ArrowUpRight, ChartLineUp, ShieldCheck, Wallet } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'

export function AuthLayout({ eyebrow, title, description, children, footer }) {
  return (
    <main className="min-h-screen bg-[#f7f7f3] font-sans text-[#18251f] lg:grid lg:grid-cols-[1fr_0.92fr]">
      <section className="relative hidden min-h-screen overflow-hidden bg-[#163b31] px-12 py-10 font-sans text-white lg:flex lg:flex-col lg:justify-between xl:px-20">
        <div className="absolute -right-36 top-1/4 size-[34rem] rounded-full border border-white/10" />
        <div className="absolute -right-16 top-[31%] size-[21rem] rounded-full border border-white/10" />
        <div className="absolute bottom-[-9rem] left-[-5rem] size-[25rem] rounded-full bg-[#a9d6a5]/10 blur-3xl" />

        <Link to="/login" className="relative flex w-fit items-center gap-3 text-sm font-semibold tracking-wide text-white">
          <span className="grid size-10 place-items-center rounded-xl bg-[#d5f27c] text-[#163b31]">
            <Wallet size={21} weight="duotone" />
          </span>
          cuentas claras
        </Link>

        <div className="relative max-w-xl pb-12">
          <p className="mb-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#d5f27c]">
            <span className="size-1.5 rounded-full bg-[#d5f27c]" />
            Tu dinero, con dirección
          </p>
          <h2 className="max-w-lg text-4xl font-semibold leading-[1.12] tracking-tight xl:text-5xl">
            Hábitos claros. Decisiones más tranquilas.
          </h2>
          <p className="mt-6 max-w-md text-sm leading-7 text-white/65">
            Lleva tus ingresos y gastos en un solo lugar y entiende mejor cómo se mueve tu dinero.
          </p>

          <div className="mt-10 flex max-w-md items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-sm">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#d5f27c]/15 text-[#d5f27c]">
              <ChartLineUp size={23} weight="duotone" />
            </span>
            <div>
              <p className="text-sm font-medium">Una vista más simple de tus finanzas</p>
              <p className="mt-1 text-xs text-white/55">Registra, revisa y sigue tu progreso.</p>
            </div>
            <ArrowUpRight className="ml-auto shrink-0 text-white/45" size={18} />
          </div>
        </div>

        <div className="relative flex items-center gap-2 text-xs text-white/45">
          <ShieldCheck size={16} />
          Tus datos se organizan en una cuenta privada.
        </div>
      </section>

      <section className="flex min-h-screen flex-col px-5 py-7 sm:px-10 lg:justify-center lg:px-14 xl:px-24">
        <Link to="/login" className="mb-10 flex w-fit items-center gap-2 text-sm font-semibold lg:hidden">
          <span className="grid size-9 place-items-center rounded-xl bg-[#163b31] text-[#d5f27c]">
            <Wallet size={19} weight="duotone" />
          </span>
          cuentas claras
        </Link>

        <div className="mx-auto w-full max-w-md">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#65816f]">{eyebrow}</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
          <p className="mt-3 text-sm leading-6 text-stone-500">{description}</p>
          <div className="mt-8">{children}</div>
          <div className="mt-7 text-sm text-stone-500">{footer}</div>
        </div>

        <p className="mx-auto mt-auto w-full max-w-md pt-12 text-xs text-stone-400 lg:mt-12 lg:pt-0">
          Finanzas personales, con calma y claridad.
        </p>
      </section>
    </main>
  )
}
