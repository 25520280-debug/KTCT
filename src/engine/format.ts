export function money(value: number): string {
  const rounded = Math.round(value)
  const abs = Math.abs(rounded).toLocaleString('en-US')
  return rounded < 0 ? `−$${abs}` : `$${abs}`
}

export function ratio(numerator: number, denominator: number): string {
  if (denominator <= 0) return '—'
  return (numerator / denominator).toFixed(2)
}

export function percent(numerator: number, denominator: number): string {
  if (denominator <= 0) return '—'
  return `${Math.round((numerator / denominator) * 100)}%`
}

// Thay {ten_bien} trong câu chữ của config bằng số liệu thật.
export function fill(template: string, vars: Record<string, string | number> = {}): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in vars ? String(vars[key]).replace(/^-/, '−') : match,
  )
}
