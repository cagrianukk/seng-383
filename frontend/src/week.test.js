import { describe, test, expect } from 'vitest'
import { addDays, formatDate, mondayOf } from './week'

describe('week', () => {
  test('mondayOf haftanın her gününden pazartesiyi bulur', () => {
    expect(mondayOf('2026-11-16')).toBe('2026-11-16')
    expect(mondayOf('2026-11-18')).toBe('2026-11-16')
    expect(mondayOf('2026-11-22')).toBe('2026-11-16')
  })

  test('mondayOf yaz saati geçişinde kaymaz', () => {
    expect(mondayOf('2026-03-29')).toBe('2026-03-23')
    expect(mondayOf('2026-10-25')).toBe('2026-10-19')
  })

  test('addDays ay ve yıl sınırını geçer', () => {
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01')
    expect(addDays('2026-12-28', 7)).toBe('2027-01-04')
    expect(addDays('2026-11-16', -7)).toBe('2026-11-09')
  })

  test('formatDate GG.AA.YYYY biçimine çevirir', () => {
    expect(formatDate('2026-11-05')).toBe('05.11.2026')
  })
})
