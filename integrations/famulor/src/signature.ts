import { createHmac, timingSafeEqual } from 'node:crypto'

export const signFamulorBody = (rawBody: string, secret: string): string =>
  `sha256=${createHmac('sha256', secret).update(rawBody).digest('hex')}`

export const verifyFamulorSignature = (
  rawBody: string,
  signatureHeader: string | undefined,
  secret: string
): boolean => {
  if (!signatureHeader) {
    return false
  }
  const expected = signFamulorBody(rawBody, secret)
  const actual = Buffer.from(signatureHeader)
  const wanted = Buffer.from(expected)
  if (actual.length !== wanted.length) {
    return false
  }
  return timingSafeEqual(actual, wanted)
}

export const readHeader = (headers: { [key: string]: string | undefined }, name: string): string | undefined =>
  headers[name] ?? headers[name.toLowerCase()]
