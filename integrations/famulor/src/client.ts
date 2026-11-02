import { type z } from '@botpress/sdk'
import { type AxiosInstance } from 'axios'
import {
  type createLeadInputSchema,
  type listAssistantsInputSchema,
  type listCallsInputSchema,
  type listCampaignsInputSchema,
  type listHistoryInputSchema,
  type listLeadsInputSchema,
  type startOutboundCallInputSchema,
} from '../definitions/schemas'
import {
  E164_PATTERN,
  RESERVED_KEYS,
  UUID_PATTERN,
  VARIABLE_KEY_PATTERN,
  WEBHOOK_EVENTS,
  type FamulorWebhookEventName,
} from './constants'
import { FamulorApiError, toFamulorApiError } from './errors'
import { createFamulorAxios, queryParams, readList, readObject, readPagination, resolveBaseUrl } from './http'
import {
  mapAssistant,
  mapCall,
  mapCallDetail,
  mapCampaign,
  mapCampaignStart,
  mapCampaignStop,
  mapHistoryItem,
  mapLead,
  mapLeadWrite,
} from './map'

type ListAssistantsInput = z.infer<typeof listAssistantsInputSchema>
type StartOutboundCallInput = z.infer<typeof startOutboundCallInputSchema>
type ListCallsInput = z.infer<typeof listCallsInputSchema>
type ListHistoryInput = z.infer<typeof listHistoryInputSchema>
type ListLeadsInput = z.infer<typeof listLeadsInputSchema>
type CreateLeadInput = z.infer<typeof createLeadInputSchema>
type ListCampaignsInput = z.infer<typeof listCampaignsInputSchema>

const assertUuid = (value: string, label: string): void => {
  if (!UUID_PATTERN.test(value)) {
    throw new FamulorApiError(`${label} must be a UUID.`, 0, 'invalid_request')
  }
}

const assertE164 = (value: string, label: string): void => {
  if (!E164_PATTERN.test(value)) {
    throw new FamulorApiError(`${label} must be an E.164 number, for example +4930123456.`, 0, 'invalid_request')
  }
}

const keyValueRecord = (
  entries: Array<{ key: string; value: string }> | undefined,
  options: { variableKeys: boolean }
): Record<string, string> | undefined => {
  if (!entries || entries.length === 0) {
    return undefined
  }
  const record: Record<string, string> = {}
  for (const entry of entries) {
    if (entry.key.trim() === '' || RESERVED_KEYS.has(entry.key)) {
      throw new FamulorApiError(`Field name "${entry.key}" is not allowed.`, 0, 'invalid_request')
    }
    if (options.variableKeys && !VARIABLE_KEY_PATTERN.test(entry.key)) {
      throw new FamulorApiError(`Variable name "${entry.key}" must match ^[a-z][a-z0-9_]{0,63}$.`, 0, 'invalid_request')
    }
    if (options.variableKeys && entry.value.length > 2000) {
      throw new FamulorApiError(`Variable "${entry.key}" exceeds 2000 characters.`, 0, 'invalid_request')
    }
    record[entry.key] = entry.value
  }
  return record
}

export class FamulorClient {
  private readonly _http: AxiosInstance

  public constructor(apiKey: string, baseUrl?: string, http?: AxiosInstance) {
    if (!apiKey.startsWith('fam_') || apiKey.length < 8) {
      throw new FamulorApiError(
        'Famulor API keys start with fam_. Create one under Settings → API & MCP at https://app.famulor.io.',
        0,
        'invalid_request'
      )
    }
    this._http = http ?? createFamulorAxios(apiKey, resolveBaseUrl(baseUrl))
  }

  public async verifyCredential(): Promise<void> {
    await this._get('/me', 'credential')
  }

  public async listAssistants(input: ListAssistantsInput) {
    const body = await this._get(
      '/assistants',
      'assistants',
      queryParams([
        ['limit', input.limit],
        ['offset', input.offset],
      ])
    )
    const items = readList(body, 'assistants').map((item) => mapAssistant(item))
    return {
      items,
      pagination: readPagination(body, { limit: input.limit, offset: input.offset, count: items.length }),
    }
  }

  public async getAssistant(id: string) {
    assertUuid(id, 'Assistant id')
    const body = await this._get(`/assistants/${id}`, 'assistant')
    return mapAssistant(readObject(body, 'assistant'))
  }

  public async startOutboundCall(input: StartOutboundCallInput) {
    assertUuid(input.assistant_id, 'Assistant id')
    assertE164(input.to_number, 'Destination number')
    if (input.phone_number_id !== undefined) {
      assertUuid(input.phone_number_id, 'Phone number id')
    }
    const lead = keyValueRecord(input.lead, { variableKeys: false })
    const variables = keyValueRecord(input.variables, { variableKeys: true })
    const body = await this._post('/calls', 'call', {
      assistant_id: input.assistant_id,
      to_number: input.to_number,
      ...(input.phone_number_id !== undefined ? { phone_number_id: input.phone_number_id } : {}),
      ...(lead !== undefined ? { lead } : {}),
      ...(variables !== undefined ? { variables } : {}),
    })
    return mapCall(readObject(body, 'call'))
  }

  public async listCalls(input: ListCallsInput) {
    const body = await this._get(
      '/calls',
      'calls',
      queryParams([
        ['assistant_id', input.assistant_id],
        ['campaign_id', input.campaign_id],
        ['status', input.status],
        ['direction', input.direction],
        ['sort', input.sort],
        ['from', input.from],
        ['to', input.to],
        ['q', input.q],
        ['limit', input.limit],
        ['offset', input.offset],
      ])
    )
    const items = readList(body, 'calls').map((item) => mapCall(item))
    return {
      items,
      pagination: readPagination(body, { limit: input.limit, offset: input.offset, count: items.length }),
    }
  }

  public async getCall(id: string) {
    assertUuid(id, 'Call id')
    const body = await this._get(`/calls/${id}`, 'call')
    return mapCallDetail(readObject(body, 'call'))
  }

  public async listConversationHistory(input: ListHistoryInput) {
    if (input.date_range !== undefined && (input.from !== undefined || input.to !== undefined)) {
      throw new FamulorApiError('date_range cannot be combined with from or to.', 0, 'invalid_request')
    }
    const body = await this._get(
      '/history',
      'history',
      queryParams([
        ['type', input.type],
        ['direction', input.direction],
        ['status', input.status],
        ['assistant_id', input.assistant_id],
        ['campaign_id', input.campaign_id],
        ['search', input.search],
        ['date_range', input.date_range],
        ['from', input.from],
        ['to', input.to],
        ['limit', input.limit],
        ['offset', input.offset],
      ])
    )
    const items = readList(body, 'history').map((item) => mapHistoryItem(item))
    return {
      items,
      pagination: readPagination(body, { limit: input.limit, offset: input.offset, count: items.length }),
    }
  }

  public async listLeads(input: ListLeadsInput) {
    const body = await this._get(
      '/leads',
      'leads',
      queryParams([
        ['search', input.search],
        ['campaign_id', input.campaign_id],
        ['display_status', input.display_status],
        ['limit', input.limit],
        ['offset', input.offset],
      ])
    )
    const items = readList(body, 'leads').map((item) => mapLead(item))
    return {
      items,
      pagination: readPagination(body, { limit: input.limit, offset: input.offset, count: items.length }),
    }
  }

  public async createLead(input: CreateLeadInput) {
    if ((input.phone === undefined || input.phone === '') && (input.email === undefined || input.email === '')) {
      throw new FamulorApiError('A lead needs a phone number or an email address.', 0, 'invalid_request')
    }
    if (input.phone !== undefined && input.phone !== '') {
      assertE164(input.phone, 'Lead phone')
    }
    if (input.email !== undefined && input.email !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
      throw new FamulorApiError('Lead email is not a valid email address.', 0, 'invalid_request')
    }
    if (input.tags !== undefined && input.tags.some((tag) => tag.length > 40)) {
      throw new FamulorApiError('Lead tags must be 40 characters or fewer.', 0, 'invalid_request')
    }
    const customFields = keyValueRecord(input.custom_fields, { variableKeys: false })
    const body = await this._post('/leads', 'lead', {
      ...(input.phone !== undefined && input.phone !== '' ? { phone: input.phone } : {}),
      ...(input.email !== undefined && input.email !== '' ? { email: input.email } : {}),
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.tags !== undefined ? { tags: input.tags } : {}),
      ...(customFields !== undefined ? { custom_fields: customFields } : {}),
    })
    return mapLeadWrite(readObject(body, 'lead'))
  }

  public async listCampaigns(input: ListCampaignsInput) {
    const body = await this._get(
      '/campaigns',
      'campaigns',
      queryParams([
        ['status', input.status],
        ['limit', input.limit],
        ['offset', input.offset],
      ])
    )
    const items = readList(body, 'campaigns').map((item) => mapCampaign(item))
    return {
      items,
      pagination: readPagination(body, { limit: input.limit, offset: input.offset, count: items.length }),
    }
  }

  public async getCampaign(id: string) {
    assertUuid(id, 'Campaign id')
    const body = await this._get(`/campaigns/${id}`, 'campaign')
    return mapCampaign(readObject(body, 'campaign'))
  }

  public async startCampaign(id: string) {
    assertUuid(id, 'Campaign id')
    const body = await this._post(`/campaigns/${id}/start`, 'campaign start', {})
    return mapCampaignStart(readObject(body, 'campaign start'))
  }

  public async stopCampaign(id: string) {
    assertUuid(id, 'Campaign id')
    const body = await this._post(`/campaigns/${id}/stop`, 'campaign stop', {})
    return mapCampaignStop(readObject(body, 'campaign stop'))
  }

  public async createWebhookSubscription(input: {
    id: string
    url: string
    secret: string
    events?: readonly FamulorWebhookEventName[]
  }): Promise<string> {
    assertUuid(input.id, 'Webhook subscription id')
    const body = await this._post('/webhooks', 'webhook subscription', {
      id: input.id,
      url: input.url,
      events: [...(input.events ?? WEBHOOK_EVENTS)],
      secret: input.secret,
    })
    const created = readObject(body, 'webhook subscription')
    return typeof created.id === 'string' ? created.id : input.id
  }

  public async deleteWebhookSubscription(id: string): Promise<void> {
    assertUuid(id, 'Webhook subscription id')
    try {
      await this._delete(`/webhooks/${id}`)
    } catch (error) {
      const wrapped = toFamulorApiError(error)
      if (wrapped.status === 404) {
        return
      }
      throw wrapped
    }
  }

  private async _get(path: string, what: string, params?: Record<string, string | number>): Promise<unknown> {
    try {
      const response = await this._http.get(path, params && Object.keys(params).length > 0 ? { params } : undefined)
      return response.data
    } catch (error) {
      throw this._withContext(error, what)
    }
  }

  private async _post(path: string, what: string, data: unknown): Promise<unknown> {
    try {
      const response = await this._http.post(path, data)
      return response.data
    } catch (error) {
      throw this._withContext(error, what)
    }
  }

  private _withContext(error: unknown, what: string): FamulorApiError {
    const wrapped = toFamulorApiError(error)
    return new FamulorApiError(`${wrapped.message} (${what})`, wrapped.status, wrapped.code)
  }

  private async _delete(path: string): Promise<void> {
    try {
      await this._http.delete(path)
    } catch (error) {
      throw toFamulorApiError(error)
    }
  }
}
