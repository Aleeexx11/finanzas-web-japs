import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/lib/currency'

const toneClasses = {
  neutral: 'bg-[#f5f5f0] text-[#56645d]',
  income: 'bg-emerald-50 text-emerald-700',
  expense: 'bg-rose-50 text-rose-700',
}

function DashboardMetricCard({ title, description, amount, icon: Icon, tone = 'neutral', isLoading = false, amountClassName = '' }) {
  return (
    <Card className="h-full gap-4 rounded-2xl border-stone-200 bg-white py-5 shadow-sm">
      <CardHeader className="flex grid-cols-none grid-rows-none flex-row items-start justify-between gap-4 px-5">
        <div className="min-w-0">
          <CardTitle className="text-xs font-medium text-stone-500">{title}</CardTitle>
          <p className="mt-1 truncate text-xs text-stone-400">{description}</p>
        </div>
        <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${toneClasses[tone] ?? toneClasses.neutral}`} aria-hidden="true">
          <Icon size={19} weight="duotone" />
        </span>
      </CardHeader>

      <CardContent className="px-5">
        {isLoading ? (
          <Skeleton className="h-8 w-36 max-w-full" aria-hidden="true" />
        ) : amount === undefined || amount === null ? (
          <p className="text-2xl font-semibold tracking-tight text-stone-400" aria-label="Dato no disponible">—</p>
        ) : (
          <p className={`truncate text-2xl font-semibold tracking-tight ${amountClassName || 'text-[#18251f]'}`}>
            {formatCurrency(amount)}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export { DashboardMetricCard }
