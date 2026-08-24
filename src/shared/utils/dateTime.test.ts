import { describe, expect, it } from 'vitest'
import { formatApiDate, formatApiDateTime, toLocalDateTimePayload } from './dateTime'

describe('dateTime', () => {
  it('genera payload local sin convertirlo a UTC', () => {
    const value = toLocalDateTimePayload(new Date('2026-08-17T08:55:06.000Z'))

    expect(value).toBe('2026-08-17T03:55:06')
    expect(value).not.toContain('Z')
  })

  it('formatea fechas locales del API sin restar horas', () => {
    expect(formatApiDateTime('2026-08-17T03:55:06')).toContain('3:55')
    expect(formatApiDate('2026-08-17')).toMatch(/2026/)
  })
})
