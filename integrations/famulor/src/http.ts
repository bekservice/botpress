import axios, { type AxiosInstance } from 'axios'
import { FAMULOR_API_BASE_URL } from './constants'
import { FamulorApiError } from './errors'

export const resolveBaseUrl = (baseUrl: string | undefined): string => {
  const trimmed = baseUrl?.trim() ?? ''
  if (trimmed === '') {
    return FAMULOR_API_BASE_URL
  }
  let url: URL
  try {
    url = new URL(trimmed)
  } catch {
    throw new FamulorApiError('API base URL must be a valid https URL ending in /api/v1.', 0, 'invalid_request')
  }
  if (url.protocol !== 'https:') {
    throw new FamulorApiError('API base URL must use https.', 0, 'invalid_request')
  }
  if (url.username !== '' || url.password !== '') {
    throw new FamulorApiError('API base URL must not include credentials.', 0, 'invalid_request')
  }
  if (url.port !== '') {
    throw new FamulorApiError('API base URL must use the default https port.', 0, 'invalid_request')
  }
  if (url.search !== '' || url.hash !== '') {
    throw new FamulorApiError('API base URL must not include a query string or fragment.', 0, 'invalid_request')
  }
  const path = url.pathname.replace(/\/$/, '')
  if (path !== '/api/v1') {
    throw new FamulorApiError('API base URL path must be /api/v1.', 0, 'invalid_request')
  }
  return `${url.origin}/api/v1`
}

export const createFamulorAxios = (apiKey: string, baseUrl: string): AxiosInstance =>
  axios.create({
    baseURL: baseUrl,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  })

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

export const readData = (body: unknown, what: string): unknown => {
  if (!isRecord(body) || !('data' in body)) {
    throw new FamulorApiError(`Famulor response for ${what} is missing data.`, 0, 'invalid_response')
  }
  return body.data
}

export const readObject = (body: unknown, what: string): Record<string, unknown> => {
  const data = readData(body, what)
  if (!isRecord(data)) {
    throw new FamulorApiError(`Famulor response for ${what} is not an object.`, 0, 'invalid_response')
  }
  return data
}

export const readList = (body: unknown, what: string): unknown[] => {
  const data = readData(body, what)
  if (!Array.isArray(data)) {
    throw new FamulorApiError(`Famulor response for ${what} is not a list.`, 0, 'invalid_response')
  }
  return data
}

export const readPagination = (
  body: unknown,
  fallback: { limit?: number | undefined; offset?: number | undefined; count: number }
): { limit: number; offset: number; total: number } => {
  const meta = isRecord(body) ? body.meta : undefined
  const pagination = isRecord(meta) ? meta.pagination : undefined
  const record = isRecord(pagination) ? pagination : {}
  const limit = typeof record.limit === 'number' ? record.limit : (fallback.limit ?? fallback.count)
  const offset = typeof record.offset === 'number' ? record.offset : (fallback.offset ?? 0)
  const total = typeof record.total === 'number' ? record.total : fallback.count
  return { limit, offset, total }
}

export const queryParams = (entries: Array<[string, string | number | undefined]>): Record<string, string | number> => {
  const params: Record<string, string | number> = {}
  for (const [key, value] of entries) {
    if (value !== undefined) {
      params[key] = value
    }
  }
  return params
}
