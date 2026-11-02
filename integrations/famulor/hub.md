# Famulor

Connect a Botpress bot to [Famulor](https://www.famulor.io), an AI voice-agent platform. The integration calls the public REST API at `https://app.famulor.io/api/v1` and can receive signed workspace webhooks.

The same customer-facing capabilities are also available as MCP tools at `https://app.famulor.io/mcp`. This integration uses the REST API, not MCP.

API reference: [https://docs.famulor.io/api-reference/introduction](https://docs.famulor.io/api-reference/introduction).

## Configuration

1. Sign in at [https://app.famulor.io](https://app.famulor.io).
2. Open **Settings → API & MCP** and create an API key. The full key is shown once and starts with `fam_`.
3. Paste the key into the integration **API Key** field. It is sent as `Authorization: Bearer fam_...`.
4. The workspace needs **API Access** (plan or add-on). Without it, requests return `403 api_access_required`.
5. Dashboard-created keys have every scope. A scoped key needs `assistants:read`, `calls:read`, `calls:write`, `leads:read`, `leads:write`, `campaigns:read`, and `campaigns:write` for the actions below. Registering webhooks also needs `settings:write`, plus `calls:read` and `bookings:read`.

**API Base URL** stays empty for Famulor Cloud. Set it only for a white-label domain, and only to an `https` URL whose path is `/api/v1`.

**Webhook Signing Secret** is optional and must be 16–256 characters when set:

- With a secret, saving the integration registers `POST /api/v1/webhooks` for `call.completed`, `conversation.ended`, `booking.created`, `booking.cancelled`, and `booking.rescheduled`. Famulor signs the raw body with HMAC-SHA256 and sends `X-Famulor-Signature: sha256=<hex>`. Deliveries that do not match are rejected.
- Without a secret, no subscription is created. You can still point an assistant's unsigned **Call completed** webhook (or a connector's **Conversation ended** URL) at the Botpress webhook URL. Those assistant URLs are unsigned; do not use that mode for anything that must be authenticated.

Removing the signing secret deletes the subscription that this integration created. Famulor may deliver the same event more than once. Branch on the event name and the call, conversation, or booking id.

Creating the subscription needs a public `https` webhook URL, which Botpress Cloud provides. It also needs a workspace owner or admin key.

## Actions

| Action                    | Famulor endpoint             | What it does                                                                                             |
| ------------------------- | ---------------------------- | -------------------------------------------------------------------------------------------------------- |
| List Assistants           | `GET /assistants`            | Assistants in the workspace, newest first                                                                |
| Get Assistant             | `GET /assistants/{id}`       | One assistant                                                                                            |
| Start Outbound Call       | `POST /calls`                | Places a call. The assistant must be active and have an outbound number. The call comes back as `queued` |
| List Calls                | `GET /calls`                 | Calls, with the documented status, direction, and search filters                                         |
| Get Call                  | `GET /calls/{id}`            | Transcript, summary, failure guidance, event log, and a signed recording URL                             |
| List Conversation History | `GET /history`               | Calls and assistant email conversations by latest activity                                               |
| List Leads                | `GET /leads`                 | Audience contacts                                                                                        |
| Create Lead               | `POST /leads`                | Creates a contact, or merges one with the same phone or email. Returns the id and whether it was new     |
| List Campaigns            | `GET /campaigns`             | Campaigns. The status filter accepts `draft`, `running`, `paused`, `completed`, and `archived`           |
| Get Campaign              | `GET /campaigns/{id}`        | One campaign, including `total_leads` when Famulor sends it                                              |
| Start Campaign            | `POST /campaigns/{id}/start` | Sets the campaign to `running` and returns the id, status, and first-wave dialed and skipped counts      |
| Stop Campaign             | `POST /campaigns/{id}/stop`  | Pauses a running campaign and returns id plus status `paused`. Returns 409 when it is not running        |

Phone numbers use E.164, for example `+4915123456789`. Call variables use lowercase names matching `^[a-z][a-z0-9_]{0,63}$`. `date_range` on history cannot be combined with `from` or `to`.

List actions return `meta.pagination` as `limit`, `offset`, and `total`.

## Events

| Event               | Famulor event         | When it fires                                                                                                 |
| ------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------- |
| Call Completed      | `call.completed`      | A call finishes. Includes transcript, variables, analysis, and failure guidance                               |
| Conversation Ended  | `conversation.ended`  | A messaging or email conversation closes (`inactivity`, `manual`, or `test`)                                  |
| Booking Created     | `booking.created`     | A booking webhook arrives. Scalar fields follow the public Booking resource; `booking_json` is the raw object |
| Booking Cancelled   | `booking.cancelled`   | Same shape as Booking Created                                                                                 |
| Booking Rescheduled | `booking.rescheduled` | Same shape as Booking Created                                                                                 |

Famulor documents full JSON examples for `call.completed` and `conversation.ended`. Booking subscriptions are documented, and this integration reads the public Booking fields from the `data` object. Anything else in that object stays in `booking_json`.

## Limits

Famulor documents a default budget of 120 requests per minute per key and 600 per workspace. A `429` includes `Retry-After`. Recordings are temporary links. Do not put the API key in client-side code.

## Changelog

- **0.1.0** – Assistants, outbound calls, call and conversation history, leads, campaigns, and signed webhooks.
