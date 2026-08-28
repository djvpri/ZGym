export const NOTA_DESIGNS = [
  { key: 'classic', label: 'Klasik', desc: 'Font mesin ketik, garis putus-putus' },
  { key: 'modern', label: 'Modern', desc: 'Font bersih, header aksen biru' },
  { key: 'compact', label: 'Kompak', desc: 'Ramping & minimal' },
  { key: 'elegan', label: 'Elegan', desc: 'Header dekoratif, bold italic' },
] as const

export type NotaDesignKey = typeof NOTA_DESIGNS[number]['key']

export function isNotaDesign(v: unknown): v is NotaDesignKey {
  return typeof v === 'string' && NOTA_DESIGNS.some(d => d.key === v)
}

// CSS varian desain nota — dipakai oleh halaman /payments/new & /payments.
// Selector [data-nota-design=X] dikenakan pada wadah nota (#nota-payment / #nota-payment-list).
export const NOTA_CSS = `
  /* ==== Klasik (default) ==== */
  [data-nota-design="classic"] { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
  [data-nota-design="classic"] .nota-block { border-top: 1px dashed #d1d5db; }
  [data-nota-design="classic"] .nota-header { text-align: center; margin-bottom: 16px; }
  [data-nota-design="classic"] .nota-brand { font-size: 18px; font-weight: 700; }

  /* ==== Modern ==== */
  [data-nota-design="modern"] { font-family: ui-sans-serif, system-ui, sans-serif; color: #1f2937; }
  [data-nota-design="modern"] .nota-header {
    background: linear-gradient(135deg, #2563eb, #1d4ed8); color: #fff;
    margin: -24px -24px 16px; padding: 20px 24px; border-radius: 12px 12px 0 0;
  }
  [data-nota-design="modern"] .nota-brand { font-size: 20px; font-weight: 700; display:flex; align-items:center; justify-content:center; gap:8px; }
  [data-nota-design="modern"] .nota-sub { color: #dbeafe; font-size: 12px; text-align: center; }
  [data-nota-design="modern"] .nota-block { border-top: 1px solid #e5e7eb; }
  [data-nota-design="modern"] .nota-total { color: #2563eb; }

  /* ==== Kompak ==== */
  [data-nota-design="compact"] { font-family: ui-sans-serif, system-ui, sans-serif; font-size: 13px; }
  [data-nota-design="compact"] .nota-header { text-align: center; margin-bottom: 12px; }
  [data-nota-design="compact"] .nota-brand { font-size: 16px; font-weight: 700; letter-spacing: 0.05em; }
  [data-nota-design="compact"] .nota-block { border-top: 1px dotted #9ca3af; }
  [data-nota-design="compact"] .nota-row { margin: 2px 0; }

  /* ==== Elegan ==== */
  [data-nota-design="elegan"] { font-family: 'Georgia', 'Times New Roman', serif; color: #111827; }
  [data-nota-design="elegan"] .nota-header { text-align: center; margin-bottom: 18px; }
  [data-nota-design="elegan"] .nota-brand { font-size: 22px; font-weight: 700; font-style: italic; letter-spacing: 0.02em; }
  [data-nota-design="elegan"] .nota-sub { font-style: italic; color: #6b7280; font-size: 12px; }
  [data-nota-design="elegan"] .nota-block { border-top: 1.5px double #9ca3af; }
  [data-nota-design="elegan"] .nota-footer { font-style: italic; text-align: center; color: #6b7280; }
`
