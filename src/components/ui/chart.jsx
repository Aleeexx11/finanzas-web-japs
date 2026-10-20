import { createContext, useContext, useId } from 'react'
import { ResponsiveContainer, Tooltip } from 'recharts'
import { cn } from '@/lib/utils'

const THEMES = {
  light: ':root',
  dark: '.dark',
}

const ChartContext = createContext(null)

function ChartContainer({ id, className, children, config, ...props }) {
  const generatedId = useId().replaceAll(':', '')
  const chartId = `chart-${id ?? generatedId}`

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-slot="chart"
        data-chart={chartId}
        className={cn(
          'flex justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line]:stroke-border/50 [&_.recharts-layer]:outline-hidden [&_.recharts-surface]:outline-hidden',
          className,
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <ResponsiveContainer>{children}</ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
}

function ChartStyle({ id, config }) {
  const rules = Object.entries(THEMES).flatMap(([theme, selector]) => {
    const variables = Object.entries(config)
      .map(([key, item]) => {
        const color = item.theme?.[theme] ?? item.color
        return color ? `  --color-${key}: ${color};` : null
      })
      .filter(Boolean)

    return variables.length
      ? [`${selector} [data-chart="${id}"] {\n${variables.join('\n')}\n}`]
      : []
  })

  if (!rules.length) return null

  return <style dangerouslySetInnerHTML={{ __html: rules.join('\n') }} />
}

function useChart() {
  const context = useContext(ChartContext)
  if (!context) throw new Error('Los componentes de chart deben usarse dentro de ChartContainer.')
  return context
}

function ChartTooltipContent({
  active,
  payload,
  label,
  labelFormatter,
  formatter,
  className,
}) {
  const { config } = useChart()

  if (!active || !payload?.length) return null

  const formattedLabel = labelFormatter ? labelFormatter(label, payload) : label

  return (
    <div className={cn('grid min-w-32 gap-2 rounded-lg border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-xl', className)}>
      {formattedLabel !== undefined && formattedLabel !== null && (
        <p className="font-medium">{formattedLabel}</p>
      )}
      <div className="grid gap-1.5">
        {payload.map((item, index) => {
          const key = String(item.dataKey ?? item.name ?? '')
          const itemConfig = config[key]
          const formattedValue = formatter
            ? formatter(item.value, item.name, item, index, payload)
            : item.value

          return (
            <div key={`${key}-${index}`} className="flex items-center gap-2">
              <span
                className="size-2 shrink-0 rounded-[2px]"
                style={{ backgroundColor: item.color ?? itemConfig?.color ?? 'currentColor' }}
                aria-hidden="true"
              />
              <span className="text-muted-foreground">{itemConfig?.label ?? item.name}</span>
              <span className="ml-auto font-mono font-medium tabular-nums">{formattedValue}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const ChartTooltip = Tooltip

export { ChartContainer, ChartTooltip, ChartTooltipContent }
