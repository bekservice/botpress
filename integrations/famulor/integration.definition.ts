import { IntegrationDefinition } from '@botpress/sdk'
import { actions, configuration, events, states } from './definitions'

export default new IntegrationDefinition({
  name: 'famulor',
  title: 'Famulor',
  description:
    'Run Famulor AI voice agents: list assistants, place outbound calls, and read call history, leads, and campaigns.',
  version: '0.1.0',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration,
  actions,
  events,
  states,
  attributes: {
    category: 'Communication & Channels',
    guideSlug: 'famulor',
    repo: 'botpress',
  },
})
