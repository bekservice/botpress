import { readHeader, verifyFamulorSignature } from './signature'
import { parseWebhook, type ParsedFamulorWebhook } from './webhooks'
import * as bp from '.botpress'

const emit = async (client: bp.Client, event: ParsedFamulorWebhook): Promise<void> => {
  switch (event.type) {
    case 'call.completed':
      await client.createEvent({ type: 'callCompleted', payload: event.payload })
      return
    case 'conversation.ended':
      await client.createEvent({ type: 'conversationEnded', payload: event.payload })
      return
    case 'booking.created':
      await client.createEvent({ type: 'bookingCreated', payload: event.payload })
      return
    case 'booking.cancelled':
      await client.createEvent({ type: 'bookingCancelled', payload: event.payload })
      return
    case 'booking.rescheduled':
      await client.createEvent({ type: 'bookingRescheduled', payload: event.payload })
      return
    case 'ignored':
      return
    default: {
      const unreachable: never = event
      throw new Error(`Unhandled Famulor webhook: ${JSON.stringify(unreachable)}`)
    }
  }
}

export const handler: bp.IntegrationProps['handler'] = async ({ req, ctx, client, logger }) => {
  if (!req.body) {
    return { status: 400, body: 'Missing body' }
  }

  const secret = ctx.configuration.webhookSigningSecret
  if (secret) {
    const signature = readHeader(req.headers, 'x-famulor-signature')
    if (!verifyFamulorSignature(req.body, signature, secret)) {
      logger.forBot().warn('Rejected a Famulor webhook with an invalid signature')
      return { status: 401, body: 'Invalid signature' }
    }
  }

  const parsed = parseWebhook(req.body)
  if (!parsed.ok) {
    logger.forBot().warn(parsed.message)
    return { status: 400, body: parsed.message }
  }
  if (parsed.event.type === 'ignored') {
    logger.forBot().info(`Ignored Famulor webhook event ${parsed.event.event}`)
    return { status: 200, body: 'ignored' }
  }

  await emit(client, parsed.event)
  return { status: 200, body: 'ok' }
}
