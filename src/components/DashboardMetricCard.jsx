import { Link } from 'react-router-dom'
import { ArrowRight } from '@phosphor-icons/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatearMoneda } from '@/lib/formatters'

const toneClasses = {
  neutral: 'bg-violet-400/15 text-violet-300',
  income: 'bg-emerald-400/15 text-emerald-300',
  expense: 'bg-rose-400/15 text-rose-300',
}

function DashboardMetricCard({
  title,
  description,
  amount,
  displayValue,
  icon: Icon,
  tone = 'neutral',
  isLoading = false,
  amountClassName = '',
  to,
}) {
  const card = (
    <Card className={`h-full gap-4 rounded-2xl border-border bg-card py-5 shadow-sm ${to ? 'transition duration-200 hover:-translate-y-0.5 hover:border-[#35d9f1]/50 hover:shadow-[0_12px_35px_rgb(0_0_0_/_18%)]' : ''}`}>
      <CardHeader className="flex grid-cols-none grid-rows-none flex-row items-start justify-between gap-4 px-5">
        <div className="min-w-0">
          <CardTitle className="text-xs font-medium text-muted-foreground">{title}</CardTitle>
          <p className="mt-1 truncate text-xs text-slate-400">{description}</p>
        </div>
        <span className={`flex size-10 shrink-0 items-center justify-center gap-1 rounded-xl ${toneClasses[tone] ?? toneClasses.neutral}`} aria-hidden="true">
          <Icon size={19} weight="duotone" />
          {to && <ArrowRight size={13} />}
        </span>
      </CardHeader>

      <CardContent className="px-5">
        {isLoading ? (
          <Skeleton className="h-8 w-36 max-w-full" aria-hidden="true" />
        ) : displayValue !== undefined && displayValue !== null ? (
          <p className={`truncate text-2xl font-semibold tracking-tight ${amountClassName || 'text-white'}`}>
            {displayValue}
          </p>
        ) : amount === undefined || amount === null ? (
          <p className="text-2xl font-semibold tracking-tight text-slate-500" aria-label="Dato no disponible">—</p>
        ) : (
          <p className={`truncate text-2xl font-semibold tracking-tight ${amountClassName || 'text-white'}`}>
            {formatearMoneda(amount)}
          </p>
        )}
      </CardContent>
    </Card>
  )

  if (to) {
    return <Link to={to} aria-label={`${title}: abrir módulo`} className="block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35d9f1] focus-visible:ring-offset-2 focus-visible:ring-offset-[#071321]">{card}</Link>
  }

  return card
}

export { DashboardMetricCard }
