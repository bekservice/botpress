import axios, { AxiosError, AxiosHeaders, type AxiosInstance, type AxiosResponse } from 'axios'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { FamulorClient } from './client'
import { FAMULOR_API_BASE_URL } from './constants'
import { FamulorApiError } from './errors'
import { resolveBaseUrl } from './http'

const assistant = {
  id: 'a1b2c3d4-0000-4000-8000-000000000001',
  name: 'Support Agent',
  is_active: true,
  system_prompt: 'You are a friendly support agent.',
  mode: 'pipeline',
  first_message: 'Hi! How can I help you today?',
  stt_language: 'en',
  webhook_url: null,
  tags: ['support'],
  created_at: '2026-07-01T09:00:00Z',
  updated_at: '2026-07-01T09:00:00Z',
}

const call = {
  id: 'c1b2c3d4-0000-4000-8000-000000000010',
  assistant_id: assistant.id,
  phone_number_id: '11111111-1111-4111-8111-111111111111',
  direction: 'outbound',
  from_number: '+4930123456',
  to_number: '+4915123456789',
  status: 'queued',
  started_at: null,
  answered_at: null,
  ended_at: null,
  duration_sec: null,
  transcript: null,
  summary: null,
  created_at: '2026-07-01T10:00:00Z',
  updated_at: '2026-07-01T10:03:30Z',
}

const httpError = (status: number, data: unknown, headers: Record<string, string> = {}): AxiosError => {
  const response = {
    status,
    statusText: 'error',
    data,
    headers,
    config: { headers: new AxiosHeaders() },
  } as AxiosResponse
  return new AxiosError('request failed', 'ERR_BAD_REQUEST', undefined, undefined, response)
}

const mockHttp = () => {
  const http = {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  }
  const client = new FamulorClient('fam_test_key', undefined, http as unknown as AxiosInstance)
  return { http, client }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('resolveBaseUrl', () => {
  it('defaults to the public Famulor API v1 origin', () => {
    expect(resolveBaseUrl(undefined)).toBe(FAMULOR_API_BASE_URL)
    expect(resolveBaseUrl(' https://voice.example.com/api/v1/ ')).toBe('https://voice.example.com/api/v1')
  })

  it('rejects urls that are not the documented /api/v1 base', () => {
    expect(() => resolveBaseUrl('http://app.famulor.io/api/v1')).toThrow(/https/)
    expect(() => resolveBaseUrl('https://app.famulor.io/api')).toThrow(/\/api\/v1/)
    expect(() => resolveBaseUrl('https://user:pass@app.famulor.io/api/v1')).toThrow(/credentials/)
  })
})

describe('FamulorClient', () => {
  it('sends the bearer token to the documented base url', () => {
    const create = vi.spyOn(axios, 'create').mockReturnValue({} as AxiosInstance)
    new FamulorClient('fam_live_key')
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        baseURL: 'https://app.famulor.io/api/v1',
        headers: expect.objectContaining({ Authorization: 'Bearer fam_live_key' }),
      })
    )
  })

  it('rejects keys that do not use the fam_ prefix', () => {
    expect(() => new FamulorClient('sk_test')).toThrow(FamulorApiError)
  })

  it('lists assistants from GET /assistants', async () => {
    const { http, client } = mockHttp()
    http.get.mockResolvedValue({
      data: { data: [assistant], meta: { pagination: { limit: 50, offset: 0, total: 1 } } },
    })

    const page = await client.listAssistants({ limit: 50, offset: 0 })

    expect(http.get).toHaveBeenCalledWith('/assistants', { params: { limit: 50, offset: 0 } })
    expect(page.items[0]?.name).toBe('Support Agent')
    expect(page.pagination.total).toBe(1)
  })

  it('starts an outbound call with POST /calls', async () => {
    const { http, client } = mockHttp()
    http.post.mockResolvedValue({ data: { data: call } })

    const created = await client.startOutboundCall({
      assistant_id: assistant.id,
      to_number: '+4915123456789',
      phone_number_id: '11111111-1111-4111-8111-111111111111',
      lead: [
        { key: 'name', value: 'Jane Doe' },
        { key: 'company', value: 'Acme Corp' },
      ],
      variables: [{ key: 'customer_name', value: 'Max Mustermann' }],
    })

    expect(http.post).toHaveBeenCalledWith('/calls', {
      assistant_id: assistant.id,
      to_number: '+4915123456789',
      phone_number_id: '11111111-1111-4111-8111-111111111111',
      lead: { name: 'Jane Doe', company: 'Acme Corp' },
      variables: { customer_name: 'Max Mustermann' },
    })
    expect(created.status).toBe('queued')
    expect(created.failure).toBeNull()
  })

  it('rejects variable names outside the documented pattern', async () => {
    const { http, client } = mockHttp()
    await expect(
      client.startOutboundCall({
        assistant_id: assistant.id,
        to_number: '+4915123456789',
        variables: [{ key: 'Customer', value: 'Max' }],
      })
    ).rejects.toThrow(/Variable name/)
    expect(http.post).not.toHaveBeenCalled()
  })

  it('reads call details from GET /calls/{id}', async () => {
    const { http, client } = mockHttp()
    http.get.mockResolvedValue({
      data: {
        data: {
          ...call,
          status: 'completed',
          summary: 'Caller rescheduled their appointment to Friday.',
          structured_transcript: 'ai: Hi!\nhuman: Please book Friday afternoon.',
          recording_url: 'https://storage.example.com/recordings/signed-url',
          transcript: { items: [{ type: 'message', role: 'assistant', content: ['Hi!'] }] },
          events: [{ id: 'e1', type: 'state_changed' }],
        },
      },
    })

    const detail = await client.getCall(call.id)
    expect(http.get).toHaveBeenCalledWith(`/calls/${call.id}`, undefined)
    expect(detail.structured_transcript).toContain('human:')
    expect(detail.recording_url).toContain('https://storage.example.com')
    expect(detail.transcript_json).toContain('assistant')
    expect(detail.events_json).toContain('state_changed')
  })

  it('refuses to combine history date_range with from or to', async () => {
    const { http, client } = mockHttp()
    await expect(client.listConversationHistory({ date_range: 'today', from: '2026-07-01' })).rejects.toThrow(
      /date_range/
    )
    expect(http.get).not.toHaveBeenCalled()
  })

  it('creates a lead with POST /leads and requires phone or email', async () => {
    const { http, client } = mockHttp()
    await expect(client.createLead({})).rejects.toThrow(/phone number or an email/)

    http.post.mockResolvedValue({
      data: {
        data: {
          id: '11111111-1111-4111-8111-111111111111',
          created: true,
        },
      },
    })
    const lead = await client.createLead({
      phone: '+4915123456789',
      name: 'Jane Doe',
      tags: ['vip'],
      custom_fields: [{ key: 'plan', value: 'pro' }],
    })
    expect(http.post).toHaveBeenCalledWith('/leads', {
      phone: '+4915123456789',
      name: 'Jane Doe',
      tags: ['vip'],
      custom_fields: { plan: 'pro' },
    })
    expect(lead).toEqual({ id: '11111111-1111-4111-8111-111111111111', created: true })
  })

  it('maps the documented campaign start and stop payloads', async () => {
    const { http, client } = mockHttp()
    const campaignId = 'ca1b2c3d-0000-4000-8000-000000000030'
    http.post.mockResolvedValueOnce({
      data: { data: { campaign_id: campaignId, status: 'running', tick: { dialed: 3, skipped: 0 } } },
    })
    await expect(client.startCampaign(campaignId)).resolves.toEqual({
      campaign_id: campaignId,
      status: 'running',
      dialed: 3,
      skipped: 0,
      tick_error: null,
    })
    http.post.mockResolvedValueOnce({ data: { data: { campaign_id: campaignId, status: 'paused' } } })
    await expect(client.stopCampaign(campaignId)).resolves.toEqual({
      campaign_id: campaignId,
      status: 'paused',
    })
  })

  it('maps Famulor error envelopes and retry hints', async () => {
    const { http, client } = mockHttp()
    http.get.mockRejectedValue(
      httpError(429, { error: { code: 'rate_limited', message: 'Too many requests.' } }, { 'retry-after': '12' })
    )
    await expect(client.verifyCredential()).rejects.toThrow(/429 rate_limited: Too many requests\. Retry after 12/)
    expect(http.get).toHaveBeenCalledWith('/me', undefined)
  })

  it('treats a missing webhook subscription as already deleted', async () => {
    const { http, client } = mockHttp()
    http.delete.mockRejectedValue(httpError(404, { error: { code: 'not_found', message: 'Not found' } }))
    await expect(client.deleteWebhookSubscription('11111111-1111-4111-8111-111111111111')).resolves.toBeUndefined()
  })
})
