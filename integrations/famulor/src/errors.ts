import axios from 'axios'

export class FamulorApiError extends Error {
  public readonly status: number
  public readonly code: string

  public constructor(message: string, status: number, code: string) {
    super(message)
    this.name = 'FamulorApiError'
    this.status = status
    this.code = code
  }
}

const readErrorBody = (data: unknown): { code: string; message: string } => {
  if (typeof data === 'string' && data.trim().length > 0) {
    return { code: 'invalid_request', message: data.slice(0, 500) }
  }
  if (typeof data !== 'object' || data === null) {
    return { code: 'invalid_request', message: 'Famulor returned an error without a message.' }
  }
  const record = data as Record<string, unknown>
  const nested = record.error
  if (typeof nested === 'object' && nested !== null) {
    const error = nested as Record<string, unknown>
    const code = typeof error.code === 'string' ? error.code : 'invalid_request'
    const message = typeof error.message === 'string' ? error.message : 'Famulor request failed.'
    return { code, message }
  }
  if (typeof record.message === 'string') {
    return { code: 'invalid_request', message: record.message }
  }
  return { code: 'invalid_request', message: 'Famulor request failed.' }
}

export const toFamulorApiError = (error: unknown): FamulorApiError => {
  if (error instanceof FamulorApiError) {
    return error
  }
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return new FamulorApiError('Could not reach the Famulor API.', 0, 'network_error')
    }
    const { code, message } = readErrorBody(error.response.data)
    const retryAfter = error.response.headers?.['retry-after']
    const retryHint =
      typeof retryAfter === 'string' && retryAfter.length > 0 ? ` Retry after ${retryAfter} seconds.` : ''
    return new FamulorApiError(
      `Famulor API ${error.response.status} ${code}: ${message}${retryHint}`,
      error.response.status,
      code
    )
  }
  if (error instanceof Error) {
    return new FamulorApiError(error.message, 0, 'invalid_request')
  }
  return new FamulorApiError('Famulor request failed.', 0, 'invalid_request')
}
