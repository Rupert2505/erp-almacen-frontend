type ApiEnvelope<T> = {
  success?: boolean
  message?: string
  data: T
  timestamp?: string
}

function isApiEnvelope<T>(value: T | ApiEnvelope<T>): value is ApiEnvelope<T> {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'data' in value &&
      'success' in value,
  )
}

export function unwrapApiData<T>(value: T | ApiEnvelope<T>) {
  return isApiEnvelope(value) ? value.data : value
}
