const APP_TIME_ZONE = 'America/Lima'
const LOCALE = 'es-PE'

type DateStyle = 'short' | 'medium'

function getTimeZonePartMap(date: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
    minute: '2-digit',
    month: '2-digit',
    second: '2-digit',
    timeZone: APP_TIME_ZONE,
    year: 'numeric',
  }).formatToParts(date)

  return Object.fromEntries(parts.map((part) => [part.type, part.value]))
}

export function toLocalDateTimePayload(date = new Date()) {
  const parts = getTimeZonePartMap(date)

  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}`
}

function parseApiDate(value: string) {
  const trimmedValue = value.trim()
  const dateTimeMatch = trimmedValue.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,9})?)?$/,
  )

  if (dateTimeMatch) {
    const [, year, month, day, hour, minute, second = '00'] = dateTimeMatch
    return {
      date: new Date(
        Date.UTC(
          Number(year),
          Number(month) - 1,
          Number(day),
          Number(hour),
          Number(minute),
          Number(second),
        ),
      ),
      timeZone: 'UTC',
    }
  }

  const dateMatch = trimmedValue.match(/^(\d{4})-(\d{2})-(\d{2})$/)

  if (dateMatch) {
    const [, year, month, day] = dateMatch
    return {
      date: new Date(Date.UTC(Number(year), Number(month) - 1, Number(day))),
      timeZone: 'UTC',
    }
  }

  return {
    date: new Date(trimmedValue),
    timeZone: APP_TIME_ZONE,
  }
}

export function formatApiDateTime(value?: string | null, dateStyle: DateStyle = 'short') {
  if (!value) {
    return '-'
  }

  const parsed = parseApiDate(value)
  if (Number.isNaN(parsed.date.getTime())) {
    return '-'
  }

  return new Intl.DateTimeFormat(LOCALE, {
    dateStyle,
    timeStyle: 'short',
    timeZone: parsed.timeZone,
  }).format(parsed.date)
}

export function formatApiDate(value?: string | null, dateStyle: DateStyle = 'medium') {
  if (!value) {
    return '-'
  }

  const parsed = parseApiDate(value)
  if (Number.isNaN(parsed.date.getTime())) {
    return '-'
  }

  return new Intl.DateTimeFormat(LOCALE, {
    dateStyle,
    timeZone: parsed.timeZone,
  }).format(parsed.date)
}
