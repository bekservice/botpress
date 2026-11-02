import { z, type IntegrationDefinitionProps } from '@botpress/sdk'

export const configuration = {
  schema: z.object({
    apiKey: z
      .string()
      .min(8)
      .secret()
      .title('API Key')
      .describe(
        'Workspace API key from Famulor Settings → API & MCP (https://app.famulor.io). Keys look like fam_... and are sent as Authorization: Bearer. Dashboard keys have every scope. API Access must be enabled for the workspace.'
      ),
    webhookSigningSecret: z
      .string()
      .min(16)
      .max(256)
      .secret()
      .optional()
      .title('Webhook Signing Secret')
      .describe(
        'Optional secret of 16–256 characters. When set, the integration registers a signed webhook subscription for call, conversation, and booking events and rejects deliveries whose X-Famulor-Signature does not match. Leave empty to accept the unsigned assistant-level call.completed webhook instead.'
      ),
    baseUrl: z
      .string()
      .url()
      .optional()
      .title('API Base URL')
      .describe(
        'Override only for a white-label Famulor domain. Must be an https URL whose path is /api/v1. Defaults to https://app.famulor.io/api/v1.'
      ),
  }),
} satisfies IntegrationDefinitionProps['configuration']
