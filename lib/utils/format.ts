import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** 원화 포맷 — 1억 단위 축약 */
export function fmtKRW(value: number): string {
  if (Math.abs(value) >= 100_000_000) {
    return `${(value / 100_000_000).toFixed(2)}억`
  }
  if (Math.abs(value) >= 10_000_000) {
    return `${(value / 10_000_000).toFixed(1)}천만`
  }
  return new Intl.NumberFormat('ko-KR').format(value) + '원'
}

/** 원화 전체 금액 (툴팁·보조 텍스트용) */
export function fmtKRWFull(value: number): string {
  return new Intl.NumberFormat('ko-KR').format(value) + '원'
}

/** 수량 포맷 — 천 단위 콤마 */
export function fmtQty(value: number, unit = 'EA'): string {
  return new Intl.NumberFormat('ko-KR').format(value) + ' ' + unit
}

/** 비율 포맷 */
export function fmtRate(value: number, decimals = 1): string {
  return value.toFixed(decimals) + '%'
}

/** 차이 포맷 (부호 포함) */
export function fmtDelta(value: number, type: 'amount' | 'qty' | 'rate' = 'amount'): string {
  const sign = value > 0 ? '+' : ''
  if (type === 'amount') return sign + fmtKRW(value)
  if (type === 'qty') return sign + new Intl.NumberFormat('ko-KR').format(value) + ' EA'
  return sign + value.toFixed(1) + '%'
}

/** 날짜 포맷 */
export function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** 기간 레이블 */
export function periodLabel(period: number): string {
  return period === 0 ? '누계' : `${period}월`
}

export const MODEL_LABELS: Record<string, string> = {
  all: '전체',
  'ston-s': 'STON-S',
  'ston-cart': 'STON+(카트리지)',
  'ston-plus': 'STON+',
}

export const MODEL_GROUP_TO_FILTER: Record<string, string> = {
  'STON-S': 'ston-s',
  'STON-CART': 'ston-cart',
  'STON-PLUS': 'ston-plus',
}
