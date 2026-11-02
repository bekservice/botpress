import { z, type IntegrationDefinitionProps } from '@botpress/sdk'

export const states = {
  webhookSubscription: {
    type: 'integration',
    schema: z.object({
      subscriptionId: z
        .string()
        .title('Subscription ID')
        .describe(
          'Id of the Famulor webhook subscription created for this installation. Empty when webhooks are not registered.'
        ),
    }),
  },
} satisfies IntegrationDefinitionProps['states']
