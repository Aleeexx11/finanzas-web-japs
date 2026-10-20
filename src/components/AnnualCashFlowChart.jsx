import { useEffect, useMemo, useState } from 'react'
import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api'
import { centsToDecimal, decimalToCents, formatCurrency } from '@/lib/currency'

const series = [
  { key: 'ingresosCents', amountKey: 'ingresos', label: 'Ingresos', color: 'var(--chart-1)' },
  { key: 'egresosCents', amountKey: 'egresos', label: 'Egresos', color: 'var(--chart-2)' },
  { key: 'balanceCents', amountKey: 'balance', label: 'Balance', color: 'var(--chart-3)' },
]

const chartConfig = Object.fromEntries(
  series.map(({ key, label, color }) => [key, { label, color }]),
)

const monthNames = Array.from({ length: 12 }, (_, index) => {
  const abbreviation = new Intl.DateTimeFormat('es-GT', { month: 'short' })
    .format(new Date(2020, index, 1))
    .replace(/\.$/, '')
  return abbreviation.charAt(0).toLocaleUpperCase('es-GT') + abbreviation.slice(1)
})

function formatAxisTick(value) {
  if (!Number.isFinite(value)) return ''
  return formatCurrency(centsToDecimal(BigInt(Math.round(value))))
}

function renderBalanceDot({ cx, cy, payload }) {
  const isNegative = payload.balanceCents < 0
  const color = isNegative ? 'var(--destructive)' : 'var(--color-balanceCents)'

  return (
    <circle
      cx={cx}
      cy={cy}
      r={isNegative ? 4.5 : 3.5}
      fill={color}
      stroke="var(--background)"
      strokeWidth={2}
    />
  )
}

function AnnualCashFlowChart({ period }) {
  const [monthlyTotals, setMonthlyTotals] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    const query = new URLSearchParams({ anio: String(period.year) })

    setIsLoading(true)
    setError('')
    setMonthlyTotals([])

    api.get(`/dashboard/resumen-anual?${query.toString()}`)
      .then((data) => {
        if (active) setMonthlyTotals(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        if (active) setError('No fue posible cargar la evolución anual. Revisa tu conexión e inténtalo de nuevo.')
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [period.month, period.year])

  const chartData = useMemo(() => {
    const totalsByMonth = new Map(monthlyTotals.map((item) => [Number(item.mes), item]))

    return Array.from({ length: 12 }, (_, index) => {
      const month = index + 1
      const total = totalsByMonth.get(month)
      const point = {
        mesNombre: monthNames[index],
        ingresos: String(total?.ingresos ?? '0.00'),
        egresos: String(total?.egresos ?? '0.00'),
        balance: String(total?.balance ?? '0.00'),
      }

      return {
        ...point,
        // Recharts uses numeric coordinates; centavos remain exact integers for DECIMAL(12,2) values.
        ingresosCents: Number(decimalToCents(point.ingresos)),
        egresosCents: Number(decimalToCents(point.egresos)),
        balanceCents: Number(decimalToCents(point.balance)),
      }
    })
  }, [monthlyTotals])

  const hasNegativeBalance = chartData.some((item) => item.balanceCents < 0)
  const hasMovements = chartData.some((item) => item.ingresosCents !== 0 || item.egresosCents !== 0)
  const amountKeyBySeries = Object.fromEntries(series.map(({ key, amountKey }) => [key, amountKey]))

  return (
    <Card className="mt-8 overflow-hidden rounded-2xl border-border bg-card py-0 shadow-sm">
      <CardHeader className="gap-1 border-b border-border/70 px-5 py-5 sm:px-6">
        <CardTitle className="text-base">Evolución financiera del año</CardTitle>
        <CardDescription>
          Doce meses de {period.year}{hasNegativeBalance ? ' · Los puntos rojos marcan balances negativos' : ''}
        </CardDescription>
      </CardHeader>

      <CardContent className="p-4 sm:p-6">
        {isLoading ? (
          <Skeleton className="h-80 w-full" aria-hidden="true" />
        ) : error ? (
          <p role="alert" className="py-16 text-center text-sm text-destructive">{error}</p>
        ) : !hasMovements ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            No hay movimientos registrados para {period.year}.
          </p>
        ) : (
          <ChartContainer config={chartConfig} className="h-[360px] w-full">
            <LineChart
              accessibilityLayer
              data={chartData}
              margin={{ top: 12, right: 12, bottom: 8, left: 12 }}
            >
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="mesNombre"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
              />
              <YAxis
                type="number"
                tickFormatter={formatAxisTick}
                tickLine={false}
                axisLine={false}
                width={94}
                tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                domain={['auto', 'auto']}
              />
              {hasNegativeBalance && (
                <ReferenceLine y={0} stroke="var(--destructive)" strokeDasharray="4 4" />
              )}
              <ChartTooltip
                content={(
                  <ChartTooltipContent
                    labelFormatter={(_, payload) => payload?.[0]?.payload?.mesNombre}
                    formatter={(_, __, item) => {
                      const amountKey = amountKeyBySeries[item?.dataKey]
                      return formatCurrency(item?.payload?.[amountKey] ?? '0.00')
                    }}
                  />
                )}
              />
              <ChartLegend content={<ChartLegendContent />} />
              {series.map(({ key, label }) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  name={label}
                  stroke={`var(--color-${key})`}
                  strokeWidth={2}
                  dot={key === 'balanceCents' ? renderBalanceDot : { r: 3 }}
                  activeDot={key === 'balanceCents' ? renderBalanceDot : { r: 5 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}

export { AnnualCashFlowChart }
