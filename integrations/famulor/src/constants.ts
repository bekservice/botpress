export const FAMULOR_API_BASE_URL = 'https://app.famulor.io/api/v1'

export const WEBHOOK_EVENTS = [
  'call.completed',
  'conversation.ended',
  'booking.created',
  'booking.cancelled',
  'booking.rescheduled',
] as const

export type FamulorWebhookEventName = (typeof WEBHOOK_EVENTS)[number]

export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export const E164_PATTERN = /^\+[1-9]\d{1,14}$/

export const VARIABLE_KEY_PATTERN = /^[a-z][a-z0-9_]{0,63}$/

export const RESERVED_KEYS = new Set(['constructor', 'prototype', '__proto__'])
