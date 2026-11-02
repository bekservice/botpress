import { z } from '@botpress/sdk'

const text = (title: string, description: string) => z.string().title(title).describe(description)

const optionalText = (title: string, description: string) => z.string().optional().title(title).describe(description)

const textOrNull = (title: string, description: string) => z.string().nullable().title(title).describe(description)

const bool = (title: string, description: string) => z.boolean().title(title).describe(description)

const boolOrNull = (title: string, description: string) => z.boolean().nullable().title(title).describe(description)

const numberOrNull = (title: string, description: string) => z.number().nullable().title(title).describe(description)

const intNumber = (title: string, description: string) => z.number().int().title(title).describe(description)

const keyValue = z
  .object({
    key: text('Key', 'Field name.'),
    value: text('Value', 'Field value. Famulor stores call variables as text, up to 2000 characters.'),
  })
  .title('Key Value')
  .describe('One named value.')

const paginationInput = {
  limit: z
    .number()
    .int()
    .min(1)
    .max(200)
    .optional()
    .title('Limit')
    .describe('Page size. Famulor defaults to 50 and allows at most 200.'),
  offset: z
    .number()
    .int()
    .min(0)
    .optional()
    .title('Offset')
    .describe('Number of matching items to skip. Defaults to 0.'),
}

export const paginationSchema = z
  .object({
    limit: intNumber('Limit', 'Page size returned by Famulor.'),
    offset: intNumber('Offset', 'Number of items skipped.'),
    total: intNumber('Total', 'Total matching items, ignoring limit and offset.'),
  })
  .title('Pagination')
  .describe('Pagination from the Famulor meta.pagination object.')

export const failureSchema = z
  .object({
    domain: text('Domain', 'Failure domain: telephony, billing, admission, runtime, config, dispatch, or workspace.'),
    operation: textOrNull(
      'Operation',
      'Telephony operation when domain is telephony: outbound_call, cold_transfer, or warm_transfer.'
    ),
    code: text('Code', 'Stable provider-neutral failure code.'),
    message: text('Message', 'Provider-neutral English explanation.'),
    retryable: bool('Retryable', 'Informational retry guidance. It does not change campaign retry policy.'),
    action: text('Action', 'Suggested action, for example retry_later, do_not_retry, check_destination, or top_up.'),
  })
  .title('Failure')
  .describe('Provider-neutral failure guidance. Present only when Famulor includes a failure object.')

export const assistantSchema = z
  .object({
    id: text('ID', 'Assistant id.'),
    name: text('Name', 'Assistant name.'),
    is_active: bool('Active', 'Disabled assistants cannot receive or place calls.'),
    mode: text('Mode', 'Engine mode: pipeline, realtime, half_cascade, or translation.'),
    system_prompt: text('System Prompt', 'Assistant system prompt.'),
    first_message: textOrNull('First Message', 'Opening line. Null when unset.'),
    stt_language: textOrNull('STT Language', 'Primary speech-recognition language (ISO-639-1).'),
    webhook_url: textOrNull('Webhook URL', 'Assistant-level call.completed webhook URL. Null when unset.'),
    webhook_delivery_mode: textOrNull('Webhook Delivery Mode', 'none, custom, or automation.'),
    tags: z.array(text('Tag', 'Free-form workspace tag.')).title('Tags').describe('Workspace tags on the assistant.'),
    created_at: text('Created At', 'Creation time in ISO 8601.'),
    updated_at: text('Updated At', 'Last update time in ISO 8601.'),
  })
  .title('Assistant')
  .describe('A Famulor assistant.')

export const callSchema = z
  .object({
    id: text('ID', 'Call id.'),
    assistant_id: textOrNull('Assistant ID', 'Assistant that handled the call.'),
    phone_number_id: textOrNull('Phone Number ID', 'Caller id used for the call.'),
    direction: text('Direction', 'inbound, outbound, or web.'),
    from_number: textOrNull('From Number', 'Calling number.'),
    to_number: textOrNull('To Number', 'Destination number.'),
    status: text('Status', 'queued, ringing, in_progress, completed, failed, no_answer, or busy.'),
    started_at: textOrNull('Started At', 'When the call started. Null until it starts.'),
    answered_at: textOrNull('Answered At', 'When the call was answered.'),
    ended_at: textOrNull('Ended At', 'When the call ended.'),
    duration_sec: numberOrNull('Duration Seconds', 'Call duration in seconds.'),
    summary: textOrNull('Summary', 'Generated call summary. Null when unavailable.'),
    sentiment: textOrNull('Sentiment', 'Post-call sentiment: positive, neutral, or negative.'),
    success: boolOrNull('Success', 'Post-call success verdict, when analysis is enabled.'),
    qa_score: numberOrNull('QA Score', 'AI QA score when a scorecard was scored.'),
    qa_passed: boolOrNull('QA Passed', 'Whether the QA scorecard passed.'),
    created_at: text('Created At', 'Creation time in ISO 8601.'),
    updated_at: text('Updated At', 'Last update time in ISO 8601.'),
    failure: failureSchema.nullable().title('Failure').describe('Provider-neutral failure guidance, or null.'),
  })
  .title('Call')
  .describe('A Famulor call.')

export const callDetailSchema = callSchema
  .extend({
    structured_transcript: textOrNull(
      'Structured Transcript',
      'Plain-text transcript with ai: and human: lines, when Famulor provides one.'
    ),
    recording_url: textOrNull(
      'Recording URL',
      'Signed recording URL. Famulor documents these links as valid for 1 hour.'
    ),
    transcript_json: textOrNull('Transcript JSON', 'JSON transcript object exactly as returned by GET /calls/{id}.'),
    events_json: textOrNull('Events JSON', 'JSON array of chronological call events from GET /calls/{id}.'),
  })
  .title('Call Detail')
  .describe('Call details from GET /calls/{id}, including transcript and recording URL.')

export const historyItemSchema = z
  .object({
    id: text('ID', 'History row id.'),
    thread_id: textOrNull('Thread ID', 'Stable email or messaging conversation id. Null for calls.'),
    lead_id: textOrNull('Lead ID', 'Audience contact id, when the row is linked to one.'),
    channel: text('Channel', 'Conversation channel, for example call, email, or whatsapp.'),
    direction: text('Direction', 'inbound, outbound, or web.'),
    assistant_id: textOrNull('Assistant ID', 'Assistant that handled the conversation.'),
    assistant_name: textOrNull('Assistant Name', 'Assistant name.'),
    status: text('Status', 'Normalized status, including skipped for some non-call rows.'),
    contact: textOrNull('Contact', 'External phone number or email address.'),
    from: textOrNull('From', 'From address or number.'),
    to: textOrNull('To', 'To address or number.'),
    subject: textOrNull('Subject', 'Email subject. Null for calls.'),
    body_preview: textOrNull('Body Preview', 'Compact plain-text preview. Null for calls.'),
    summary: textOrNull('Summary', 'Generated conversation recap. Null when unavailable.'),
    duration_sec: numberOrNull('Duration Seconds', 'Call duration in seconds. Null for email and messaging.'),
    campaign_id: textOrNull('Campaign ID', 'Campaign id when the row belongs to a campaign.'),
    reply_status: textOrNull('Reply Status', 'Raw auto-reply state for inbound emails. Null otherwise.'),
    reply_error: textOrNull('Reply Error', 'Auto-reply error, when one was recorded.'),
    attachments_count: intNumber('Attachments Count', 'Number of attachments on the conversation.'),
    message_count: intNumber('Message Count', 'Messages grouped into this conversation.'),
    created_at: text('Created At', 'Creation time in ISO 8601.'),
    last_activity_at: text('Last Activity At', 'Latest activity time. Equal to created_at for calls.'),
    failure: failureSchema
      .nullable()
      .title('Failure')
      .describe('Provider-neutral failure guidance for a failed outbound call row, or null.'),
  })
  .title('History Item')
  .describe('One row from GET /history.')

export const leadSchema = z
  .object({
    id: text('ID', 'Audience contact id.'),
    campaign_id: textOrNull('Campaign ID', 'Campaign the contact is assigned to, or null.'),
    phone: textOrNull('Phone', 'Phone number normalized to E.164.'),
    name: textOrNull('Name', 'Contact name.'),
    email: textOrNull('Email', 'Contact email.'),
    tags: z.array(text('Tag', 'Contact tag.')).title('Tags').describe('Contact tags.'),
    source: textOrNull('Source', 'Primary contact source.'),
    status: text(
      'Status',
      'Dialer status: pending, queued, calling, completed, failed, no_answer, busy, or do_not_call.'
    ),
    display_status: textOrNull(
      'Display Status',
      'Board status: created, processing, rescheduled, max_retries, completed, or dnc.'
    ),
    attempts: numberOrNull('Attempts', 'Outbound call attempts.'),
    next_attempt_at: textOrNull('Next Attempt At', 'When the next attempt is scheduled.'),
    last_call_id: textOrNull('Last Call ID', 'Most recent call id for this contact.'),
    custom_fields_json: textOrNull('Custom Fields JSON', 'JSON object of user-managed custom fields.'),
    created_at: text('Created At', 'Creation time in ISO 8601.'),
    updated_at: text('Updated At', 'Last update time in ISO 8601.'),
  })
  .title('Lead')
  .describe('A Famulor Audience contact.')

export const campaignSchema = z
  .object({
    id: text('ID', 'Campaign id.'),
    name: text('Name', 'Campaign name.'),
    status: text('Status', 'draft, scheduled, running, paused, completed, or archived.'),
    channel: textOrNull('Channel', 'phone_call, whatsapp_template, whatsapp_call, or sms.'),
    assistant_id: textOrNull('Assistant ID', 'Assistant that runs the campaign calls.'),
    concurrency: numberOrNull('Concurrency', 'Maximum parallel voice calls for this campaign.'),
    retry_max: numberOrNull('Retry Max', 'Maximum retry attempts per lead.'),
    retry_delay_minutes: numberOrNull('Retry Delay Minutes', 'Minutes between retries.'),
    timezone: textOrNull('Timezone', 'IANA timezone used for calling windows.'),
    amd_enabled: boolOrNull('AMD Enabled', 'Whether answering-machine detection is enabled.'),
    voicemail_action: textOrNull('Voicemail Action', 'hangup or drop_message.'),
    voicemail_message: textOrNull('Voicemail Message', 'Text spoken when voicemail_action is drop_message.'),
    scheduled_start_at: textOrNull('Scheduled Start At', 'Scheduled start time.'),
    started_at: textOrNull('Started At', 'When the campaign started.'),
    completed_at: textOrNull('Completed At', 'When the campaign completed.'),
    total_leads: numberOrNull('Total Leads', 'Lead count. Famulor includes this on GET /campaigns/{id}.'),
    created_at: text('Created At', 'Creation time in ISO 8601.'),
    updated_at: text('Updated At', 'Last update time in ISO 8601.'),
  })
  .title('Campaign')
  .describe('A Famulor campaign.')

const listEnvelope = <T extends z.ZodTypeAny>(item: T, itemTitle: string, itemDescription: string) =>
  z
    .object({
      items: z.array(item).title(itemTitle).describe(itemDescription),
      pagination: paginationSchema,
    })
    .title('Page')
    .describe('One page of Famulor results.')

export const listAssistantsInputSchema = z.object(paginationInput).title('Input').describe('Assistant list filters.')
export const listAssistantsOutputSchema = listEnvelope(
  assistantSchema,
  'Assistants',
  'Assistants in this page, newest first.'
)

export const getAssistantInputSchema = z
  .object({
    id: text('Assistant ID', 'Assistant id returned by List Assistants.'),
  })
  .title('Input')
  .describe('Assistant to read.')

export const startOutboundCallInputSchema = z
  .object({
    assistant_id: text('Assistant ID', 'Active assistant that runs the call.'),
    to_number: text('To Number', 'Destination in E.164 format, for example +4915123456789.'),
    phone_number_id: optionalText(
      'Phone Number ID',
      'Optional caller id. Defaults to the number assigned to the assistant.'
    ),
    lead: z
      .array(keyValue)
      .optional()
      .title('Lead')
      .describe('Contact context passed as the lead object. The documented example uses name and company.'),
    variables: z
      .array(keyValue)
      .optional()
      .title('Variables')
      .describe(
        'Explicit per-call variables. Names must match ^[a-z][a-z0-9_]{0,63}$ and must not be constructor, prototype, or __proto__.'
      ),
  })
  .title('Input')
  .describe('Outbound call request for POST /calls.')

export const listCallsInputSchema = z
  .object({
    assistant_id: optionalText('Assistant ID', 'Only calls for this assistant.'),
    campaign_id: optionalText('Campaign ID', 'Only calls placed by this campaign.'),
    status: z
      .enum(['queued', 'ringing', 'in_progress', 'completed', 'failed', 'no_answer', 'busy'])
      .optional()
      .title('Status')
      .describe('Filter by call status.'),
    direction: z
      .enum(['inbound', 'outbound', 'web'])
      .optional()
      .title('Direction')
      .describe('Filter by direction. web applies to browser calls.'),
    sort: z
      .enum(['created_at', 'updated_at'])
      .optional()
      .title('Sort')
      .describe('Newest first by creation time (default) or by latest update.'),
    from: optionalText('From', 'Only calls created at or after this ISO 8601 date or datetime.'),
    to: optionalText('To', 'Only calls created at or before this ISO 8601 date or datetime.'),
    q: optionalText('Query', 'Case-insensitive substring search across the transcript and summary.'),
    ...paginationInput,
  })
  .title('Input')
  .describe('Call list filters for GET /calls.')

export const listCallsOutputSchema = listEnvelope(callSchema, 'Calls', 'Calls in this page.')

export const getCallInputSchema = z
  .object({
    id: text('Call ID', 'Call id returned by Start Outbound Call or List Calls.'),
  })
  .title('Input')
  .describe('Call to read.')

export const listHistoryInputSchema = z
  .object({
    type: optionalText(
      'Type',
      'Comma-separated channels, for example call or call,whatsapp_voice. Matches the channel field. See the Famulor history docs for the full channel list.'
    ),
    direction: z
      .enum(['inbound', 'outbound', 'web'])
      .optional()
      .title('Direction')
      .describe('Filter by direction. web applies only to calls.'),
    status: z
      .enum(['queued', 'ringing', 'in_progress', 'completed', 'failed', 'no_answer', 'busy', 'skipped'])
      .optional()
      .title('Status')
      .describe('Filter by normalized status.'),
    assistant_id: optionalText('Assistant ID', 'Only conversations for this assistant.'),
    campaign_id: optionalText('Campaign ID', 'Only campaign calls for this campaign.'),
    search: optionalText('Search', 'Search phone numbers, email addresses, email subject or body, and call summaries.'),
    date_range: z
      .enum(['today', 'yesterday', 'last_7_days', 'last_30_days', 'last_90_days', 'this_month', 'last_month'])
      .optional()
      .title('Date Range')
      .describe('Relative period in the workspace timezone. Cannot be combined with From or To.'),
    from: optionalText(
      'From',
      'Only entries active at or after this ISO 8601 time or YYYY-MM-DD date. Cannot be combined with Date Range.'
    ),
    to: optionalText(
      'To',
      'Only entries active at or before this ISO 8601 time or YYYY-MM-DD date. Cannot be combined with Date Range.'
    ),
    ...paginationInput,
  })
  .title('Input')
  .describe('Conversation history filters for GET /history.')

export const listHistoryOutputSchema = listEnvelope(
  historyItemSchema,
  'History',
  'Conversation history rows in this page.'
)

export const listLeadsInputSchema = z
  .object({
    search: optionalText('Search', 'Search contact name, phone, or email.'),
    campaign_id: optionalText(
      'Campaign ID',
      'Campaign UUID, or the documented value none for contacts without a campaign.'
    ),
    display_status: z
      .enum(['created', 'processing', 'rescheduled', 'max_retries', 'completed', 'dnc'])
      .optional()
      .title('Display Status')
      .describe('Filter by the grouped board status.'),
    ...paginationInput,
  })
  .title('Input')
  .describe('Audience contact filters for GET /leads.')

export const listLeadsOutputSchema = listEnvelope(leadSchema, 'Leads', 'Audience contacts in this page.')

export const createLeadOutputSchema = z
  .object({
    id: text('ID', 'Audience contact id.'),
    created: bool(
      'Created',
      'True when Famulor created a new contact. False when an existing contact with the same phone or email was enriched.'
    ),
  })
  .title('Create Lead Result')
  .describe('Result of POST /leads. The endpoint returns the contact id and whether it was newly created.')

export const campaignStartOutputSchema = z
  .object({
    campaign_id: text('Campaign ID', 'Campaign that was started.'),
    status: text('Status', 'running after a successful start.'),
    dialed: numberOrNull('Dialed', 'Leads dialed in the first wave. Null when that wave did not run.'),
    skipped: numberOrNull('Skipped', 'Leads skipped in the first wave. Null when that wave did not run.'),
    tick_error: textOrNull(
      'Tick Error',
      'Present when the first wave failed. The campaign stays running and the next scheduled wave retries.'
    ),
  })
  .title('Campaign Start Result')
  .describe('Result of POST /campaigns/{id}/start.')

export const campaignStopOutputSchema = z
  .object({
    campaign_id: text('Campaign ID', 'Campaign that was paused.'),
    status: text('Status', 'paused after a successful stop.'),
  })
  .title('Campaign Stop Result')
  .describe('Result of POST /campaigns/{id}/stop.')

export const createLeadInputSchema = z
  .object({
    phone: optionalText('Phone', 'Phone number normalized to E.164. Phone or email is required.'),
    email: optionalText('Email', 'Contact email. Phone or email is required.'),
    name: optionalText('Name', 'Contact name.'),
    tags: z
      .array(text('Tag', 'Tag of at most 40 characters.'))
      .max(32)
      .optional()
      .title('Tags')
      .describe('Up to 32 tags.'),
    custom_fields: z
      .array(keyValue)
      .optional()
      .title('Custom Fields')
      .describe('User-managed contact fields. Infrastructure-managed keys are ignored by Famulor.'),
  })
  .title('Input')
  .describe('Audience contact for POST /leads. An existing contact with the same phone or email is merged.')

export const listCampaignsInputSchema = z
  .object({
    status: z
      .enum(['draft', 'running', 'paused', 'completed', 'archived'])
      .optional()
      .title('Status')
      .describe('Filter by campaign status. The list endpoint does not accept scheduled.'),
    ...paginationInput,
  })
  .title('Input')
  .describe('Campaign list filters for GET /campaigns.')

export const listCampaignsOutputSchema = listEnvelope(campaignSchema, 'Campaigns', 'Campaigns in this page.')

export const campaignIdInputSchema = z
  .object({
    id: text('Campaign ID', 'Campaign id.'),
  })
  .title('Input')
  .describe('Campaign to act on.')

export const callCompletedEventSchema = z
  .object({
    timestamp: textOrNull('Timestamp', 'When Famulor sent the call.completed event.'),
    call_id: text('Call ID', 'Completed call id.'),
    tenant_id: textOrNull('Tenant ID', 'Workspace id on the event.'),
    assistant_id: textOrNull('Assistant ID', 'Assistant that handled the call.'),
    direction: textOrNull('Direction', 'inbound, outbound, or web.'),
    status: textOrNull('Status', 'Final call status.'),
    duration_sec: numberOrNull('Duration Seconds', 'Call duration in seconds.'),
    transcript_json: textOrNull('Transcript JSON', 'JSON transcript from the webhook payload.'),
    collected_json: textOrNull('Collected JSON', 'JSON collected flow variables.'),
    variables_json: textOrNull('Variables JSON', 'JSON resolved call variables.'),
    input_variables_json: textOrNull('Input Variables JSON', 'JSON input variables supplied for the call.'),
    qa_scorecard_json: textOrNull('QA Scorecard JSON', 'JSON AI QA scorecard, or null when the assistant has none.'),
    summary: textOrNull('Summary', 'Post-call analysis summary.'),
    sentiment: textOrNull('Sentiment', 'Post-call sentiment, when analysis includes it.'),
    success: boolOrNull('Success', 'Post-call success verdict, when analysis includes it.'),
    success_reason: textOrNull('Success Reason', 'Why the success verdict was chosen.'),
    failure: failureSchema
      .nullable()
      .title('Failure')
      .describe('Provider-neutral failure guidance when the call did not connect.'),
  })
  .title('Call Completed')
  .describe('Payload of a Famulor call.completed webhook.')

export const conversationEndedEventSchema = z
  .object({
    timestamp: textOrNull('Timestamp', 'When Famulor sent the conversation.ended event.'),
    reason: textOrNull('Reason', 'Why the conversation ended: inactivity, manual, or test.'),
    tenant_id: textOrNull('Tenant ID', 'Workspace id.'),
    conversation_id: text('Conversation ID', 'Closed conversation id.'),
    platform: textOrNull('Platform', 'Messaging platform, for example telegram.'),
    status: textOrNull('Status', 'Conversation status, for example closed.'),
    duration_sec: numberOrNull('Duration Seconds', 'Conversation duration in seconds.'),
    message_count: numberOrNull('Message Count', 'Number of messages in the conversation.'),
    transcript: textOrNull('Transcript', 'Plain-text transcript.'),
    messages_json: textOrNull('Messages JSON', 'JSON array of conversation messages.'),
    summary: textOrNull('Summary', 'Analysis summary.'),
    sentiment: textOrNull('Sentiment', 'Analysis sentiment.'),
    success: boolOrNull('Success', 'Analysis success verdict.'),
    success_reason: textOrNull('Success Reason', 'Why the success verdict was chosen.'),
    analysis_data_json: textOrNull('Analysis Data JSON', 'JSON map of extracted analysis fields.'),
    analyzed_at: textOrNull('Analyzed At', 'When analysis finished.'),
    external_thread_id: textOrNull('External Thread ID', 'Thread id on the messaging platform.'),
    external_user_id: textOrNull('External User ID', 'User id on the messaging platform.'),
    external_user_name: textOrNull('External User Name', 'User name on the messaging platform.'),
    connector_id: textOrNull('Connector ID', 'Messaging connector id.'),
    connector_name: textOrNull('Connector Name', 'Messaging connector name.'),
    assistant_id: textOrNull('Assistant ID', 'Assistant id.'),
    assistant_name: textOrNull('Assistant Name', 'Assistant name.'),
  })
  .title('Conversation Ended')
  .describe('Payload of a Famulor conversation.ended webhook.')

export const bookingEventSchema = z
  .object({
    timestamp: textOrNull('Timestamp', 'When Famulor sent the booking event, when the payload includes one.'),
    booking_json: text(
      'Booking JSON',
      'JSON booking object from the webhook data field. Fields follow the public Booking resource.'
    ),
    id: textOrNull('ID', 'Booking id, when present on the booking object.'),
    event_type_id: textOrNull('Event Type ID', 'Booking event type id.'),
    event_type_name: textOrNull('Event Type Name', 'Booking event type name.'),
    invitee_name: textOrNull('Invitee Name', 'Invitee name.'),
    invitee_email: textOrNull('Invitee Email', 'Invitee email.'),
    invitee_phone: textOrNull('Invitee Phone', 'Invitee phone.'),
    start_at: textOrNull('Start At', 'Appointment start time.'),
    end_at: textOrNull('End At', 'Appointment end time.'),
    status: textOrNull('Status', 'confirmed, cancelled, completed, or no_show.'),
    source: textOrNull('Source', 'web, call, api, or manual.'),
  })
  .title('Booking Event')
  .describe('A Famulor booking.created, booking.cancelled, or booking.rescheduled webhook.')
