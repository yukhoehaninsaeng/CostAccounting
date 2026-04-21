export function formatCurrency(amount: number, currency = 'KRW'): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('ko-KR').format(value)
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`
}

export function calcVariance(actual: number, plan: number): number {
  return actual - plan
}

export function calcVarianceRate(actual: number, plan: number): number {
  if (plan === 0) return 0
  return ((actual - plan) / plan) * 100
}

export function calcBurnRate(actual: number, budget: number): number {
  if (budget === 0) return 0
  return (actual / budget) * 100
}

export function getPeriodLabel(period: number): string {
  return `${period}월`
}

export function getYearOptions(): number[] {
  const currentYear = new Date().getFullYear()
  return [currentYear - 1, currentYear, currentYear + 1]
}

export function getPeriodOptions(): number[] {
  return Array.from({ length: 12 }, (_, i) => i + 1)
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}
