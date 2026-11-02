import { RuntimeError } from '@botpress/sdk'
import {
  assistantSchema,
  callDetailSchema,
  callSchema,
  campaignSchema,
  campaignStartOutputSchema,
  campaignStopOutputSchema,
  createLeadOutputSchema,
  listAssistantsOutputSchema,
  listCallsOutputSchema,
  listCampaignsOutputSchema,
  listHistoryOutputSchema,
  listLeadsOutputSchema,
} from '../../definitions/schemas'
import { FamulorClient } from '../client'
import { toFamulorApiError } from '../errors'
import * as bp from '.botpress'

const clientFrom = (configuration: bp.configuration.Configuration): FamulorClient =>
  new FamulorClient(configuration.apiKey, configuration.baseUrl)

const run = async <T>(work: () => Promise<T>): Promise<T> => {
  try {
    return await work()
  } catch (error) {
    if (error instanceof RuntimeError) {
      throw error
    }
    throw new RuntimeError(toFamulorApiError(error).message)
  }
}

export default {
  listAssistants: async ({ ctx, input }) =>
    run(async () => listAssistantsOutputSchema.parse(await clientFrom(ctx.configuration).listAssistants(input))),
  getAssistant: async ({ ctx, input }) =>
    run(async () => assistantSchema.parse(await clientFrom(ctx.configuration).getAssistant(input.id))),
  startOutboundCall: async ({ ctx, input }) =>
    run(async () => callSchema.parse(await clientFrom(ctx.configuration).startOutboundCall(input))),
  listCalls: async ({ ctx, input }) =>
    run(async () => listCallsOutputSchema.parse(await clientFrom(ctx.configuration).listCalls(input))),
  getCall: async ({ ctx, input }) =>
    run(async () => callDetailSchema.parse(await clientFrom(ctx.configuration).getCall(input.id))),
  listConversationHistory: async ({ ctx, input }) =>
    run(async () => listHistoryOutputSchema.parse(await clientFrom(ctx.configuration).listConversationHistory(input))),
  listLeads: async ({ ctx, input }) =>
    run(async () => listLeadsOutputSchema.parse(await clientFrom(ctx.configuration).listLeads(input))),
  createLead: async ({ ctx, input }) =>
    run(async () => createLeadOutputSchema.parse(await clientFrom(ctx.configuration).createLead(input))),
  listCampaigns: async ({ ctx, input }) =>
    run(async () => listCampaignsOutputSchema.parse(await clientFrom(ctx.configuration).listCampaigns(input))),
  getCampaign: async ({ ctx, input }) =>
    run(async () => campaignSchema.parse(await clientFrom(ctx.configuration).getCampaign(input.id))),
  startCampaign: async ({ ctx, input }) =>
    run(async () => campaignStartOutputSchema.parse(await clientFrom(ctx.configuration).startCampaign(input.id))),
  stopCampaign: async ({ ctx, input }) =>
    run(async () => campaignStopOutputSchema.parse(await clientFrom(ctx.configuration).stopCampaign(input.id))),
} satisfies bp.IntegrationProps['actions']
