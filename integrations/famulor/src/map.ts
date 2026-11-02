import { FamulorApiError } from './errors'
import { isRecord } from './http'

const stringOrNull = (record: Record<string, unknown>, key: string): string | null =>
  typeof record[key] === 'string' ? record[key] : null

const requireString = (record: Record<string, unknown>, key: string, what: string): string => {
  const value = record[key]
  if (typeof value !== 'string') {
    throw new FamulorApiError(`Famulor response for ${what} is missing ${key}.`, 0, 'invalid_response')
  }
  return value
}

const boolOrNull = (record: Record<string, unknown>, key: string): boolean | null =>
  typeof record[key] === 'boolean' ? record[key] : null

const requireBool = (record: Record<string, unknown>, key: string, what: string): boolean => {
  const value = record[key]
  if (typeof value !== 'boolean') {
    throw new FamulorApiError(`Famulor response for ${what} is missing ${key}.`, 0, 'invalid_response')
  }
  return value
}

const numberOrNull = (record: Record<string, unknown>, key: string): number | null =>
  typeof record[key] === 'number' ? record[key] : null

const stringList = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []

const jsonOrNull = (value: unknown): string | null => {
  if (value === undefined || value === null) {
    return null
  }
  return JSON.stringify(value)
}

const requireObject = (value: unknown, what: string): Record<string, unknown> => {
  if (!isRecord(value)) {
    throw new FamulorApiError(`Famulor response for ${what} is not an object.`, 0, 'invalid_response')
  }
  return value
}

export const mapFailure = (value: unknown) => {
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

export const mapAssistant = (value: unknown) => {
  const record = requireObject(value, 'assistant')
  return {
    id: requireString(record, 'id', 'assistant'),
    name: requireString(record, 'name', 'assistant'),
    is_active: requireBool(record, 'is_active', 'assistant'),
    mode: requireString(record, 'mode', 'assistant'),
    system_prompt: requireString(record, 'system_prompt', 'assistant'),
    first_message: stringOrNull(record, 'first_message'),
    stt_language: stringOrNull(record, 'stt_language'),
    webhook_url: stringOrNull(record, 'webhook_url'),
    webhook_delivery_mode: stringOrNull(record, 'webhook_delivery_mode'),
    tags: stringList(record.tags),
    created_at: requireString(record, 'created_at', 'assistant'),
    updated_at: requireString(record, 'updated_at', 'assistant'),
  }
}

export const mapCall = (value: unknown) => {
  const record = requireObject(value, 'call')
  return {
    id: requireString(record, 'id', 'call'),
    assistant_id: stringOrNull(record, 'assistant_id'),
    phone_number_id: stringOrNull(record, 'phone_number_id'),
    direction: requireString(record, 'direction', 'call'),
    from_number: stringOrNull(record, 'from_number'),
    to_number: stringOrNull(record, 'to_number'),
    status: requireString(record, 'status', 'call'),
    started_at: stringOrNull(record, 'started_at'),
    answered_at: stringOrNull(record, 'answered_at'),
    ended_at: stringOrNull(record, 'ended_at'),
    duration_sec: numberOrNull(record, 'duration_sec'),
    summary: stringOrNull(record, 'summary'),
    sentiment: stringOrNull(record, 'sentiment'),
    success: boolOrNull(record, 'success'),
    qa_score: numberOrNull(record, 'qa_score'),
    qa_passed: boolOrNull(record, 'qa_passed'),
    created_at: requireString(record, 'created_at', 'call'),
    updated_at: requireString(record, 'updated_at', 'call'),
    failure: mapFailure(record.failure),
  }
}

export const mapCallDetail = (value: unknown) => {
  const record = requireObject(value, 'call')
  return {
    ...mapCall(record),
    structured_transcript: stringOrNull(record, 'structured_transcript'),
    recording_url: stringOrNull(record, 'recording_url'),
    transcript_json: jsonOrNull(record.transcript),
    events_json: jsonOrNull(record.events),
  }
}

export const mapHistoryItem = (value: unknown) => {
  const record = requireObject(value, 'history item')
  return {
    id: requireString(record, 'id', 'history item'),
    thread_id: stringOrNull(record, 'thread_id'),
    lead_id: stringOrNull(record, 'lead_id'),
    channel: requireString(record, 'channel', 'history item'),
    direction: requireString(record, 'direction', 'history item'),
    assistant_id: stringOrNull(record, 'assistant_id'),
    assistant_name: stringOrNull(record, 'assistant_name'),
    status: requireString(record, 'status', 'history item'),
    contact: stringOrNull(record, 'contact'),
    from: stringOrNull(record, 'from'),
    to: stringOrNull(record, 'to'),
    subject: stringOrNull(record, 'subject'),
    body_preview: stringOrNull(record, 'body_preview'),
    summary: stringOrNull(record, 'summary'),
    duration_sec: numberOrNull(record, 'duration_sec'),
    campaign_id: stringOrNull(record, 'campaign_id'),
    reply_status: stringOrNull(record, 'reply_status'),
    reply_error: stringOrNull(record, 'reply_error'),
    attachments_count: numberOrNull(record, 'attachments_count') ?? 0,
    message_count: numberOrNull(record, 'message_count') ?? 0,
    created_at: requireString(record, 'created_at', 'history item'),
    last_activity_at: requireString(record, 'last_activity_at', 'history item'),
    failure: mapFailure(record.failure),
  }
}

export const mapLead = (value: unknown) => {
  const record = requireObject(value, 'lead')
  return {
    id: requireString(record, 'id', 'lead'),
    campaign_id: stringOrNull(record, 'campaign_id'),
    phone: stringOrNull(record, 'phone'),
    name: stringOrNull(record, 'name'),
    email: stringOrNull(record, 'email'),
    tags: stringList(record.tags),
    source: stringOrNull(record, 'source'),
    status: requireString(record, 'status', 'lead'),
    display_status: stringOrNull(record, 'display_status'),
    attempts: numberOrNull(record, 'attempts'),
    next_attempt_at: stringOrNull(record, 'next_attempt_at'),
    last_call_id: stringOrNull(record, 'last_call_id'),
    custom_fields_json: jsonOrNull(record.custom_fields),
    created_at: requireString(record, 'created_at', 'lead'),
    updated_at: requireString(record, 'updated_at', 'lead'),
  }
}

export const mapLeadWrite = (value: unknown) => {
  const record = requireObject(value, 'lead')
  return {
    id: requireString(record, 'id', 'lead'),
    created: requireBool(record, 'created', 'lead'),
  }
}

export const mapCampaignStart = (value: unknown) => {
  const record = requireObject(value, 'campaign start')
  const tick = isRecord(record.tick) ? record.tick : null
  return {
    campaign_id: requireString(record, 'campaign_id', 'campaign start'),
    status: requireString(record, 'status', 'campaign start'),
    dialed: tick ? numberOrNull(tick, 'dialed') : null,
    skipped: tick ? numberOrNull(tick, 'skipped') : null,
    tick_error: stringOrNull(record, 'tick_error'),
  }
}

export const mapCampaignStop = (value: unknown) => {
  const record = requireObject(value, 'campaign stop')
  return {
    campaign_id: requireString(record, 'campaign_id', 'campaign stop'),
    status: requireString(record, 'status', 'campaign stop'),
  }
}

export const mapCampaign = (value: unknown) => {
  const record = requireObject(value, 'campaign')
  return {
    id: requireString(record, 'id', 'campaign'),
    name: requireString(record, 'name', 'campaign'),
    status: requireString(record, 'status', 'campaign'),
    channel: stringOrNull(record, 'channel'),
    assistant_id: stringOrNull(record, 'assistant_id'),
    concurrency: numberOrNull(record, 'concurrency'),
    retry_max: numberOrNull(record, 'retry_max'),
    retry_delay_minutes: numberOrNull(record, 'retry_delay_minutes'),
    timezone: stringOrNull(record, 'timezone'),
    amd_enabled: boolOrNull(record, 'amd_enabled'),
    voicemail_action: stringOrNull(record, 'voicemail_action'),
    voicemail_message: stringOrNull(record, 'voicemail_message'),
    scheduled_start_at: stringOrNull(record, 'scheduled_start_at'),
    started_at: stringOrNull(record, 'started_at'),
    completed_at: stringOrNull(record, 'completed_at'),
    total_leads: numberOrNull(record, 'total_leads'),
    created_at: requireString(record, 'created_at', 'campaign'),
    updated_at: requireString(record, 'updated_at', 'campaign'),
  }
}
