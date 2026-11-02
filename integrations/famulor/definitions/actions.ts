import { type ActionDefinition, type IntegrationDefinitionProps } from '@botpress/sdk'
import {
  assistantSchema,
  callDetailSchema,
  callSchema,
  campaignIdInputSchema,
  campaignSchema,
  campaignStartOutputSchema,
  campaignStopOutputSchema,
  createLeadInputSchema,
  createLeadOutputSchema,
  getAssistantInputSchema,
  getCallInputSchema,
  listAssistantsInputSchema,
  listAssistantsOutputSchema,
  listCallsInputSchema,
  listCallsOutputSchema,
  listCampaignsInputSchema,
  listCampaignsOutputSchema,
  listHistoryInputSchema,
  listHistoryOutputSchema,
  listLeadsInputSchema,
  listLeadsOutputSchema,
  startOutboundCallInputSchema,
} from './schemas'

const listAssistants = {
  title: 'List Assistants',
  description: 'List assistants in the Famulor workspace, newest first.',
  input: { schema: listAssistantsInputSchema },
  output: { schema: listAssistantsOutputSchema },
} as const satisfies ActionDefinition

const getAssistant = {
  title: 'Get Assistant',
  description: 'Read one assistant by id.',
  input: { schema: getAssistantInputSchema },
  output: { schema: assistantSchema },
} as const satisfies ActionDefinition

const startOutboundCall = {
  title: 'Start Outbound Call',
  description:
    'Place an outbound call. The assistant must be active and needs an outbound-capable phone number. Famulor returns the call immediately with status queued.',
  input: { schema: startOutboundCallInputSchema },
  output: { schema: callSchema },
} as const satisfies ActionDefinition

const listCalls = {
  title: 'List Calls',
  description: 'List calls in the workspace, newest first unless sort is updated_at.',
  input: { schema: listCallsInputSchema },
  output: { schema: listCallsOutputSchema },
} as const satisfies ActionDefinition

const getCall = {
  title: 'Get Call',
  description:
    'Read one call, including the transcript, summary, failure guidance, event log, and signed recording URL.',
  input: { schema: getCallInputSchema },
  output: { schema: callDetailSchema },
} as const satisfies ActionDefinition

const listConversationHistory = {
  title: 'List Conversation History',
  description: 'List calls and assistant email conversations, sorted by latest activity.',
  input: { schema: listHistoryInputSchema },
  output: { schema: listHistoryOutputSchema },
} as const satisfies ActionDefinition

const listLeads = {
  title: 'List Leads',
  description: 'List Audience contacts across campaigns.',
  input: { schema: listLeadsInputSchema },
  output: { schema: listLeadsOutputSchema },
} as const satisfies ActionDefinition

const createLead = {
  title: 'Create Lead',
  description:
    'Create an Audience contact, or merge tags and missing identity fields into an existing contact with the same phone or email.',
  input: { schema: createLeadInputSchema },
  output: { schema: createLeadOutputSchema },
} as const satisfies ActionDefinition

const listCampaigns = {
  title: 'List Campaigns',
  description: 'List campaigns in the workspace.',
  input: { schema: listCampaignsInputSchema },
  output: { schema: listCampaignsOutputSchema },
} as const satisfies ActionDefinition

const getCampaign = {
  title: 'Get Campaign',
  description: 'Read one campaign, including its lead count when Famulor returns it.',
  input: { schema: campaignIdInputSchema },
  output: { schema: campaignSchema },
} as const satisfies ActionDefinition

const startCampaign = {
  title: 'Start Campaign',
  description:
    'Set a campaign to running and trigger the first dialer wave. Calling windows, the do-not-call list, and concurrency still apply.',
  input: { schema: campaignIdInputSchema },
  output: { schema: campaignStartOutputSchema },
} as const satisfies ActionDefinition

const stopCampaign = {
  title: 'Stop Campaign',
  description:
    'Pause a running campaign. Calls already in progress finish. Famulor returns 409 when the campaign is not running.',
  input: { schema: campaignIdInputSchema },
  output: { schema: campaignStopOutputSchema },
} as const satisfies ActionDefinition

export const actions = {
  listAssistants,
  getAssistant,
  startOutboundCall,
  listCalls,
  getCall,
  listConversationHistory,
  listLeads,
  createLead,
  listCampaigns,
  getCampaign,
  startCampaign,
  stopCampaign,
} as const satisfies IntegrationDefinitionProps['actions']
