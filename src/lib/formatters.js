const currencyFormatter = new Intl.NumberFormat('es-GT', {
  style: 'currency',
  currency: 'GTQ',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const integerFormatter = new Intl.NumberFormat('es-GT', {
  maximumFractionDigits: 0,
})

const dateOnlyPattern = /^(\d{4})-(\d{2})-(\d{2})$/

function formatearDecimalExacto(amount) {
  const match = /^(-?)(\d+)(?:\.(\d{1,2}))?$/.exec(String(amount ?? '0.00').trim())
  if (!match) return currencyFormatter.format(0)

  const [, sign, wholeText, fractionText = ''] = match
  const fraction = fractionText.padEnd(2, '0')
  const whole = BigInt(wholeText)
  const isNegative = sign === '-' && (whole > 0n || fraction !== '00')
  const template = currencyFormatter.formatToParts(isNegative ? -1n : 1n)
  const groupedWhole = integerFormatter
    .formatToParts(whole)
    .filter((part) => part.type === 'integer' || part.type === 'group')

  let insertedWhole = false
  return template
    .flatMap((part) => {
      if (part.type === 'integer') {
        if (insertedWhole) return []
        insertedWhole = true
        return groupedWhole
      }

      if (part.type === 'fraction') return [{ ...part, value: fraction }]
      return [part]
    })
    .map((part) => part.value)
    .join('')
}

/**
 * Formats numbers as GTQ. Decimal strings are also accepted so API DECIMAL(12,2)
 * values can keep their cents without a conversion through JavaScript's float type.
 */
export function formatearMoneda(amount) {
  if (typeof amount === 'number') {
    return Number.isFinite(amount) ? currencyFormatter.format(amount) : currencyFormatter.format(0)
  }

  return formatearDecimalExacto(amount)
}

/** Formats backend date strings in Spanish, preserving date-only values across time zones. */
export function formatearFecha(value) {
  if (value === null || value === undefined || value === '') return '—'

  const input = String(value)
  const dateOnlyMatch = dateOnlyPattern.exec(input)
  let date
  let options = { day: '2-digit', month: 'short', year: 'numeric' }

  if (dateOnlyMatch) {
    date = new Date(`${input}T00:00:00.000Z`)
    options = { ...options, timeZone: 'UTC' }
    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== input) return input
  } else {
    date = new Date(input)
  }

  if (Number.isNaN(date.getTime())) return input
  return new Intl.DateTimeFormat('es-GT', options).format(date)
}

/** Returns the Spanish long name for a month numbered from 1 through 12. */
export function nombreMes(month) {
  const monthNumber = Number(month)
  if (!Number.isInteger(monthNumber) || monthNumber < 1 || monthNumber > 12) return ''

  return new Intl.DateTimeFormat('es-GT', { month: 'long', timeZone: 'UTC' })
    .format(new Date(Date.UTC(2020, monthNumber - 1, 1)))
}
