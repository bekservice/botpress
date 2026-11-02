import { type z } from '@botpress/sdk'
import { bookingEventSchema, callCompletedEventSchema, conversationEndedEventSchema } from '../definitions/schemas'
import { isRecord } from './http'

type CallCompleted = z.infer<typeof callCompletedEventSchema>
type ConversationEnded = z.infer<typeof conversationEndedEventSchema>
type BookingEvent = z.infer<typeof bookingEventSchema>

export type ParsedFamulorWebhook =
  | { type: 'call.completed'; payload: CallCompleted }
  | { type: 'conversation.ended'; payload: ConversationEnded }
  | { type: 'booking.created'; payload: BookingEvent }
  | { type: 'booking.cancelled'; payload: BookingEvent }
  | { type: 'booking.rescheduled'; payload: BookingEvent }
  | { type: 'ignored'; event: string }

export type WebhookParseResult = { ok: true; event: ParsedFamulorWebhook } | { ok: false; message: string }

const jsonOrNull = (value: unknown): string | null => {
  if (value === undefined || value === null) {
    return null
  }
  return JSON.stringify(value)
}

const stringOrNull = (record: Record<string, unknown>, key: string): string | null =>
  typeof record[key] === 'string' ? record[key] : null

const numberOrNull = (record: Record<string, unknown>, key: string): number | null =>
  typeof record[key] === 'number' ? record[key] : null

const boolOrNull = (record: Record<string, unknown>, key: string): boolean | null =>
  typeof record[key] === 'boolean' ? record[key] : null

const objectOrEmpty = (value: unknown): Record<string, unknown> => (isRecord(value) ? value : {})

const failureOrNull = (value: unknown): CallCompleted['failure'] => {
  if (!isRecord(value)) {
    return null
  }
  if (
    typeof value.domain !== 'string' ||
    typeof value.code !== 'string' ||
    typeof value.message !== 'string' ||
    typeof value.retryable !== 'boolean' ||
    typeof value.action !== 'string'
  ) {
    return null
  }
  return {
    domain: value.domain,
    operation: typeof value.operation === 'string' ? value.operation : null,
    code: value.code,
    message: value.message,
    retryable: value.retryable,
    action: value.action,
  }
}

const parseCallCompleted = (body: Record<string, unknown>): WebhookParseResult => {
  const data = objectOrEmpty(body.data)
  const analysis = objectOrEmpty(data.analysis)
  const callId = stringOrNull(data, 'call_id')
  if (!callId) {
    return { ok: false, message: 'call.completed webhook is missing data.call_id' }
  }
  const parsed = callCompletedEventSchema.safeParse({
    timestamp: stringOrNull(body, 'timestamp'),
    call_id: callId,
    tenant_id: stringOrNull(data, 'tenant_id'),
    assistant_id: stringOrNull(data, 'assistant_id'),
    direction: stringOrNull(data, 'direction'),
    status: stringOrNull(data, 'status'),
    duration_sec: numberOrNull(data, 'duration_sec'),
    transcript_json: jsonOrNull(data.transcript),
    collected_json: jsonOrNull(data.collected),
    variables_json: jsonOrNull(data.variables),
    input_variables_json: jsonOrNull(data.input_variables),
    qa_scorecard_json: jsonOrNull(data.qa_scorecard),
    summary: stringOrNull(analysis, 'summary'),
    sentiment: stringOrNull(analysis, 'sentiment'),
    success: boolOrNull(analysis, 'success'),
    success_reason: stringOrNull(analysis, 'success_reason'),
    failure: failureOrNull(data.failure),
  })
  if (!parsed.success) {
    return { ok: false, message: 'call.completed webhook did not match the documented payload' }
  }
  return { ok: true, event: { type: 'call.completed', payload: parsed.data } }
}

const parseConversationEnded = (body: Record<string, unknown>): WebhookParseResult => {
  const data = objectOrEmpty(body.data)
  const conversation = isRecord(data.conversation)
    ? data.conversation
    : isRecord(body.conversation)
      ? body.conversation
      : {}
  const connector = isRecord(data.connector) ? data.connector : isRecord(body.connector) ? body.connector : {}
  const assistant = isRecord(data.assistant) ? data.assistant : isRecord(body.assistant) ? body.assistant : {}
  const analysis = isRecord(data.analysis) ? data.analysis : isRecord(body.analysis) ? body.analysis : {}
  const conversationId = stringOrNull(data, 'conversation_id') ?? stringOrNull(conversation, 'id')
  if (!conversationId) {
    return { ok: false, message: 'conversation.ended webhook is missing data.conversation_id' }
  }
  const transcript = stringOrNull(data, 'transcript') ?? (typeof body.transcript === 'string' ? body.transcript : null)
  const parsed = conversationEndedEventSchema.safeParse({
    timestamp: stringOrNull(body, 'timestamp'),
    reason: stringOrNull(body, 'reason'),
    tenant_id: stringOrNull(data, 'tenant_id'),
    conversation_id: conversationId,
    platform: stringOrNull(data, 'platform') ?? stringOrNull(conversation, 'platform'),
    status: stringOrNull(data, 'status'),
    duration_sec: numberOrNull(data, 'duration_sec'),
    message_count: numberOrNull(data, 'message_count'),
    transcript,
    messages_json: jsonOrNull(data.messages),
    summary: stringOrNull(analysis, 'summary'),
    sentiment: stringOrNull(analysis, 'sentiment'),
    success: boolOrNull(analysis, 'success'),
    success_reason: stringOrNull(analysis, 'success_reason'),
    analysis_data_json: jsonOrNull(analysis.data),
    analyzed_at: stringOrNull(analysis, 'analyzed_at'),
    external_thread_id: stringOrNull(conversation, 'external_thread_id'),
    external_user_id: stringOrNull(conversation, 'external_user_id'),
    external_user_name: stringOrNull(conversation, 'external_user_name'),
    connector_id: stringOrNull(connector, 'id'),
    connector_name: stringOrNull(connector, 'name'),
    assistant_id: stringOrNull(assistant, 'id'),
    assistant_name: stringOrNull(assistant, 'name'),
  })
  if (!parsed.success) {
    return { ok: false, message: 'conversation.ended webhook did not match the documented payload' }
  }
  return { ok: true, event: { type: 'conversation.ended', payload: parsed.data } }
}

const parseBooking = (
  event: 'booking.created' | 'booking.cancelled' | 'booking.rescheduled',
  body: Record<string, unknown>
): WebhookParseResult => {
  const data = isRecord(body.data) ? body.data : {}
  const parsed = bookingEventSchema.safeParse({
    timestamp: stringOrNull(body, 'timestamp'),
    booking_json: JSON.stringify(isRecord(body.data) ? body.data : {}),
    id: stringOrNull(data, 'id'),
    event_type_id: stringOrNull(data, 'event_type_id'),
    event_type_name: stringOrNull(data, 'event_type_name'),
    invitee_name: stringOrNull(data, 'invitee_name'),
    invitee_email: stringOrNull(data, 'invitee_email'),
    invitee_phone: stringOrNull(data, 'invitee_phone'),
    start_at: stringOrNull(data, 'start_at'),
    end_at: stringOrNull(data, 'end_at'),
    status: stringOrNull(data, 'status'),
    source: stringOrNull(data, 'source'),
  })
  if (!parsed.success) {
    return { ok: false, message: `${event} webhook did not match the documented booking fields` }
  }
  return { ok: true, event: { type: event, payload: parsed.data } }
}

export const parseWebhook = (rawBody: string): WebhookParseResult => {
  let body: unknown
  try {
    body = JSON.parse(rawBody)
  } catch {
    return { ok: false, message: 'Webhook body is not JSON' }
  }
  if (!isRecord(body) || typeof body.event !== 'string') {
    return { ok: false, message: 'Webhook body is missing event' }
  }
  switch (body.event) {
    case 'call.completed':
      return parseCallCompleted(body)
    case 'conversation.ended':
      return parseConversationEnded(body)
    case 'booking.created':
    case 'booking.cancelled':
    case 'booking.rescheduled':
      return parseBooking(body.event, body)
    default:
      return { ok: true, event: { type: 'ignored', event: body.event } }
  }
}
