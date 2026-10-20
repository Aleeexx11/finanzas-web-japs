const currencyFormatter = new Intl.NumberFormat('es-GT', {
  style: 'currency',
  currency: 'GTQ',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const integerFormatter = new Intl.NumberFormat('es-GT', {
  maximumFractionDigits: 0,
})

export function decimalToCents(amount) {
  const match = /^(-?)(\d+)(?:\.(\d{1,2}))?$/.exec(String(amount ?? '0.00').trim())
  if (!match) return 0n

  const [, sign, whole, fraction = ''] = match
  const cents = (BigInt(whole) * 100n) + BigInt(fraction.padEnd(2, '0'))
  return sign === '-' ? -cents : cents
}

export function centsToDecimal(cents) {
  const sign = cents < 0n ? '-' : ''
  const absoluteCents = cents < 0n ? -cents : cents
  return `${sign}${absoluteCents / 100n}.${String(absoluteCents % 100n).padStart(2, '0')}`
}

export function formatCurrency(amount) {
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
