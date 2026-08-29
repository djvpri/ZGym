// Konfigurasi Day Pass: harga per-hari + tarif khusus hari libur + tanggal libur.
// Disimpan sbg JSON string di Setting key="daypass", group="billing".
// shape: { prices: {monday:30000,...}, holidayPrice:60000, default:35000, holidays:["2026-09-01"] }
export type DaypassConfig = {
  prices: Partial<Record<WeekDay, number>>
  holidayPrice: number
  default: number
  holidays: string[]
}

export type WeekDay = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'

export const WEEKDAYS: WeekDay[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
export const WEEKDAY_LABEL: Record<WeekDay, string> = {
  sunday: 'Minggu', monday: 'Senin', tuesday: 'Selasa', wednesday: 'Rabu',
  thursday: 'Kamis', friday: 'Jumat', saturday: 'Sabtu',
}

export function parseDaypass(raw: string | undefined | null): DaypassConfig {
  try {
    const c = JSON.parse(raw || '{}')
    return {
      prices: c.prices || {},
      holidayPrice: Number(c.holidayPrice) || 0,
      default: Number(c.default) || 0,
      holidays: Array.isArray(c.holidays) ? c.holidays : [],
    }
  } catch {
    return { prices: {}, holidayPrice: 0, default: 0, holidays: [] }
  }
}

export const DEFAULT_DAYPASS: DaypassConfig = { prices: {}, holidayPrice: 0, default: 0, holidays: [] }

// Local date -> 'YYYY-MM-DD' (bukan UTC, biar cocok di Indonesia)
export function toDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function weekdayOf(d: Date): WeekDay {
  return WEEKDAYS[d.getDay()] // getDay: 0=Minggu -> WEEKDAYS[0]=sunday
}

// Harga day pass utk tanggal tertentu. Libur > by-day > default.
export function daypassPriceFor(d: Date, cfg: DaypassConfig): number {
  const ds = toDateStr(d)
  if (cfg.holidays.includes(ds)) return cfg.holidayPrice
  const byDay = cfg.prices[weekdayOf(d)]
  if (byDay) return byDay
  return cfg.default
}
