import { RuntimeError } from '@botpress/sdk'
import { randomUUID } from 'node:crypto'
import { FamulorClient } from './client'
import { toFamulorApiError } from './errors'
import * as bp from '.botpress'

const runtimeError = (error: unknown): RuntimeError => new RuntimeError(toFamulorApiError(error).message)

const loadSubscriptionId = async (client: bp.Client, integrationId: string): Promise<string> => {
  const { state } = await client.getOrSetState({
    type: 'integration',
    name: 'webhookSubscription',
    id: integrationId,
    payload: { subscriptionId: '' },
  })
  return state.payload.subscriptionId
}

const saveSubscriptionId = async (client: bp.Client, integrationId: string, subscriptionId: string): Promise<void> => {
  await client.setState({
    type: 'integration',
    name: 'webhookSubscription',
    id: integrationId,
    payload: { subscriptionId },
  })
}

export const register: bp.IntegrationProps['register'] = async ({ ctx, client, logger, webhookUrl }) => {
  const famulor = new FamulorClient(ctx.configuration.apiKey, ctx.configuration.baseUrl)
  try {
    await famulor.verifyCredential()
  } catch (error) {
    throw runtimeError(error)
  }
  logger.forBot().info('Famulor API key verified')

  const secret = ctx.configuration.webhookSigningSecret
  const existingId = await loadSubscriptionId(client, ctx.integrationId)
  if (!secret) {
    if (existingId) {
      try {
        await famulor.deleteWebhookSubscription(existingId)
      } catch (error) {
        throw runtimeError(error)
      }
      await saveSubscriptionId(client, ctx.integrationId, '')
    }
    return
  }

  const subscriptionId = existingId || randomUUID()
  try {
    const createdId = await famulor.createWebhookSubscription({ id: subscriptionId, url: webhookUrl, secret })
    await saveSubscriptionId(client, ctx.integrationId, createdId)
    logger.forBot().info(`Famulor webhook subscription ${createdId} is registered`)
  } catch (error) {
    const wrapped = toFamulorApiError(error)
    if (wrapped.status !== 409) {
      throw new RuntimeError(wrapped.message)
    }
    try {
      await famulor.deleteWebhookSubscription(subscriptionId)
    } catch (deleteError) {
      logger.forBot().warn(`Could not replace Famulor webhook subscription: ${toFamulorApiError(deleteError).message}`)
    }
    try {
      const createdId = await famulor.createWebhookSubscription({ id: randomUUID(), url: webhookUrl, secret })
      await saveSubscriptionId(client, ctx.integrationId, createdId)
      logger.forBot().info(`Famulor webhook subscription ${createdId} replaced a conflicting registration`)
    } catch (retryError) {
      throw runtimeError(retryError)
    }
  }
}

export const unregister: bp.IntegrationProps['unregister'] = async ({ ctx, client, logger }) => {
  const existingId = await loadSubscriptionId(client, ctx.integrationId)
  if (!existingId) {
    return
  }
  const famulor = new FamulorClient(ctx.configuration.apiKey, ctx.configuration.baseUrl)
  try {
    await famulor.deleteWebhookSubscription(existingId)
    logger.forBot().info(`Removed Famulor webhook subscription ${existingId}`)
  } catch (error) {
    logger
      .forBot()
      .warn(`Could not remove Famulor webhook subscription ${existingId}: ${toFamulorApiError(error).message}`)
  }
  await saveSubscriptionId(client, ctx.integrationId, '')
}
