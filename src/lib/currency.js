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

export { formatearMoneda as formatCurrency } from './formatters'
