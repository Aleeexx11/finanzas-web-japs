import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api'
import { formatCurrency } from '@/lib/currency'

const chartConfig = {
  montoEnCentavos: {
    label: 'Egresos',
    color: 'var(--chart-1)',
  },
}

function decimalToCents(amount) {
  const match = /^(-?)(\d+)(?:\.(\d{1,2}))?$/.exec(String(amount ?? '0.00').trim())
  if (!match) return 0n

  const [, sign, whole, fraction = ''] = match
  const cents = (BigInt(whole) * 100n) + BigInt(fraction.padEnd(2, '0'))
  return sign === '-' ? -cents : cents
}

function centsToDecimal(cents) {
  const sign = cents < 0n ? '-' : ''
  const absoluteCents = cents < 0n ? -cents : cents
  return `${sign}${absoluteCents / 100n}.${String(absoluteCents % 100n).padStart(2, '0')}`
}

function formatAxisTick(value) {
  if (!Number.isFinite(value)) return ''
  return formatCurrency(centsToDecimal(BigInt(Math.round(value))))
}

function renderAmountLabel({ x, y, width, height, value }) {
  if (x == null || y == null || width == null || height == null || value == null) return null

  return (
    <text
      x={x + width + 8}
      y={y + height / 2}
      dominantBaseline="middle"
      className="fill-muted-foreground"
      fontSize={12}
    >
      {formatCurrency(value)}
    </text>
  )
}

function getPeriodLabel(period) {
  const month = new Intl.DateTimeFormat('es-GT', { month: 'long' })
    .format(new Date(period.year, period.month - 1, 1))
  const capitalizedMonth = month.charAt(0).toLocaleUpperCase('es-GT') + month.slice(1)
  return `${capitalizedMonth} ${period.year}`
}

function ExpensesByCategoryChart({ period }) {
  const [expenses, setExpenses] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    const query = new URLSearchParams({
      anio: String(period.year),
      mes: String(period.month),
    })

    setIsLoading(true)
    setError('')
    setExpenses([])

    api.get(`/dashboard/egresos-por-categoria?${query.toString()}`)
      .then((data) => {
        if (active) setExpenses(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        if (active) setError('No fue posible cargar los egresos por categoría. Revisa tu conexión e inténtalo de nuevo.')
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [period.month, period.year])

  const chartData = useMemo(() => expenses
    .map((expense) => ({
      id: expense.id,
      categoria: String(expense.nombre ?? ''),
      total: String(expense.total ?? '0.00'),
      cents: decimalToCents(expense.total),
    }))
    .sort((first, second) => (first.cents > second.cents ? -1 : first.cents < second.cents ? 1 : 0))
    .map(({ cents, ...expense }) => ({
      ...expense,
      montoEnCentavos: Number(cents),
    })), [expenses])

  const periodLabel = getPeriodLabel(period)

  return (
    <Card className="mt-8 overflow-hidden rounded-2xl border-border bg-card py-0 shadow-sm">
      <CardHeader className="gap-1 border-b border-border/70 px-5 py-5 sm:px-6">
        <CardTitle className="text-base">Egresos por categoría</CardTitle>
        <CardDescription>Distribución de egresos en {periodLabel}</CardDescription>
      </CardHeader>

      <CardContent className="p-4 sm:p-6">
        {isLoading ? (
          <Skeleton className="h-72 w-full" aria-hidden="true" />
        ) : error ? (
          <p role="alert" className="py-16 text-center text-sm text-destructive">{error}</p>
        ) : chartData.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            No hay egresos registrados en {periodLabel}.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <ChartContainer
              config={chartConfig}
              className="min-w-[620px] w-full"
              style={{ height: `${Math.max(280, chartData.length * 44 + 36)}px` }}
            >
              <BarChart
                accessibilityLayer
                data={chartData}
                layout="vertical"
                margin={{ top: 8, right: 176, bottom: 8, left: 4 }}
              >
                <CartesianGrid horizontal={false} stroke="var(--border)" />
                <XAxis
                  type="number"
                  dataKey="montoEnCentavos"
                  domain={[0, (maximum) => maximum || 100]}
                  tickFormatter={formatAxisTick}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                />
                <YAxis
                  type="category"
                  dataKey="categoria"
                  width={144}
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                />
                <ChartTooltip
                  cursor={{ fill: 'var(--muted)', opacity: 0.5 }}
                  content={(
                    <ChartTooltipContent
                      labelFormatter={(_, payload) => payload?.[0]?.payload?.categoria}
                      formatter={(_, __, item) => formatCurrency(item?.payload?.total ?? '0.00')}
                    />
                  )}
                />
                <Bar
                  dataKey="montoEnCentavos"
                  fill="var(--color-montoEnCentavos)"
                  radius={[0, 4, 4, 0]}
                  maxBarSize={28}
                >
                  <LabelList dataKey="total" content={renderAmountLabel} />
                </Bar>
              </BarChart>
            </ChartContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export { ExpensesByCategoryChart }
