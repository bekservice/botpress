import { describe, expect, it } from 'vitest'
import { parseWebhook } from './webhooks'

const callCompleted = {
  event: 'call.completed',
  timestamp: '2026-08-26T14:32:07.000Z',
  data: {
    call_id: 'c1b2c3d4-0000-4000-8000-000000000010',
    tenant_id: '9f86d081-0000-4000-8000-000000000020',
    assistant_id: '1b2c3d4e-0000-4000-8000-000000000030',
    direction: 'outbound',
    status: 'completed',
    duration_sec: 132,
    transcript: {
      items: [
        { type: 'message', role: 'assistant', content: ['Hi, this is Alex from Riverside Dental.'] },
        { type: 'message', role: 'user', content: ['Hi, yes, I have a moment.'] },
      ],
    },
    collected: { appointment_time: '2026-09-02T10:00:00Z' },
    variables: { lead_quality: 'high' },
    input_variables: { customer_name: 'Max Mustermann' },
    analysis: {
      summary: 'Customer confirmed interest and booked a demo.',
      sentiment: 'positive',
      success: true,
      success_reason: 'Appointment booked',
    },
    qa_scorecard: null,
  },
}

describe('parseWebhook', () => {
  it('maps the documented call.completed payload', () => {
    const parsed = parseWebhook(JSON.stringify(callCompleted))
    expect(parsed.ok).toBe(true)
    if (!parsed.ok || parsed.event.type !== 'call.completed') {
      throw new Error('expected call.completed')
    }
    expect(parsed.event.payload.call_id).toBe(callCompleted.data.call_id)
    expect(parsed.event.payload.summary).toBe('Customer confirmed interest and booked a demo.')
    expect(parsed.event.payload.success).toBe(true)
    expect(parsed.event.payload.input_variables_json).toContain('Max Mustermann')
    expect(parsed.event.payload.qa_scorecard_json).toBeNull()
  })

  it('maps the documented conversation.ended payload, including the nested conversation', () => {
    const parsed = parseWebhook(
      JSON.stringify({
        event: 'conversation.ended',
        timestamp: '2026-08-26T14:32:07.000Z',
        reason: 'inactivity',
        data: {
          tenant_id: '9f86d081-0000-4000-8000-000000000020',
          conversation_id: 'c1b2c3d4-0000-4000-8000-000000000010',
          platform: 'telegram',
          status: 'closed',
          duration_sec: 187,
          message_count: 6,
          conversation: {
            id: 'c1b2c3d4-0000-4000-8000-000000000010',
            platform: 'telegram',
            external_thread_id: '123456789',
            external_user_id: '123456789',
            external_user_name: 'Max Mustermann',
          },
          connector: { id: '1b2c3d4e-0000-4000-8000-000000000030', name: 'Support Telegram', platform: 'telegram' },
          assistant: { id: '2c3d4e5f-0000-4000-8000-000000000040', name: 'Support Assistant' },
          transcript: 'Customer: Hi, I need help with my order.',
          messages: [{ id: 'msg-1', role: 'user', text: 'Hi, I need help with my order.' }],
          analysis: {
            summary: 'Customer asked about an order and got help finding it.',
            sentiment: 'positive',
            success: true,
            success_reason: 'The order was located and the delivery date confirmed.',
            data: { order_number: '12345' },
            analyzed_at: '2026-08-26T14:32:07.000Z',
          },
        },
      })
    )
    expect(parsed.ok).toBe(true)
    if (!parsed.ok || parsed.event.type !== 'conversation.ended') {
      throw new Error('expected conversation.ended')
    }
    expect(parsed.event.payload.reason).toBe('inactivity')
    expect(parsed.event.payload.external_user_name).toBe('Max Mustermann')
    expect(parsed.event.payload.connector_name).toBe('Support Telegram')
    expect(parsed.event.payload.analysis_data_json).toContain('12345')
  })

  it('keeps booking resource fields and the raw booking object', () => {
    const parsed = parseWebhook(
      JSON.stringify({
        event: 'booking.created',
        timestamp: '2026-08-26T14:32:07.000Z',
        data: {
          id: 'b1b2c3d4-0000-4000-8000-000000000010',
          event_type_name: 'Demo',
          invitee_name: 'Jane Doe',
          invitee_email: 'jane@example.com',
          start_at: '2026-09-02T10:00:00Z',
          end_at: '2026-09-02T10:30:00Z',
          status: 'confirmed',
          source: 'call',
        },
      })
    )
    expect(parsed.ok).toBe(true)
    if (!parsed.ok || parsed.event.type !== 'booking.created') {
      throw new Error('expected booking.created')
    }
    expect(parsed.event.payload.invitee_email).toBe('jane@example.com')
    expect(parsed.event.payload.booking_json).toContain('Demo')
  })

  it('rejects invalid json and ignores undocumented event names', () => {
    expect(parseWebhook('not-json').ok).toBe(false)
    const ignored = parseWebhook(JSON.stringify({ event: 'call.variables' }))
    expect(ignored.ok).toBe(true)
    if (ignored.ok) {
      expect(ignored.event.type).toBe('ignored')
    }
  })
})
