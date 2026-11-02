import { type EventDefinition, type IntegrationDefinitionProps } from '@botpress/sdk'
import { bookingEventSchema, callCompletedEventSchema, conversationEndedEventSchema } from './schemas'

const callCompleted = {
  title: 'Call Completed',
  description:
    'Sent when Famulor delivers a call.completed webhook with the transcript, analysis, and failure guidance.',
  schema: callCompletedEventSchema,
} as const satisfies EventDefinition

const conversationEnded = {
  title: 'Conversation Ended',
  description:
    'Sent when Famulor delivers a conversation.ended webhook after a messaging or email conversation closes.',
  schema: conversationEndedEventSchema,
} as const satisfies EventDefinition

const bookingCreated = {
  title: 'Booking Created',
  description: 'Sent when Famulor delivers a booking.created webhook.',
  schema: bookingEventSchema,
} as const satisfies EventDefinition

const bookingCancelled = {
  title: 'Booking Cancelled',
  description: 'Sent when Famulor delivers a booking.cancelled webhook.',
  schema: bookingEventSchema,
} as const satisfies EventDefinition

const bookingRescheduled = {
  title: 'Booking Rescheduled',
  description: 'Sent when Famulor delivers a booking.rescheduled webhook.',
  schema: bookingEventSchema,
} as const satisfies EventDefinition

export const events = {
  callCompleted,
  conversationEnded,
  bookingCreated,
  bookingCancelled,
  bookingRescheduled,
} as const satisfies IntegrationDefinitionProps['events']
