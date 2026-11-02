# Famulor integration

Botpress integration for the [Famulor](https://www.famulor.io) AI voice-agent platform. Hub copy lives in [hub.md](./hub.md). The HTTP client talks only to the public API v1 documented at [docs.famulor.io](https://docs.famulor.io/api-reference/introduction).

## Setup

1. Create an API key in Famulor under **Settings → API & MCP** at [https://app.famulor.io](https://app.famulor.io). The key starts with `fam_` and is shown once.
2. In the integration configuration, paste it into **API Key**. Requests use `Authorization: Bearer <key>` against `https://app.famulor.io/api/v1`.
3. The workspace plan needs API Access. Otherwise Famulor returns `403 api_access_required`.
4. Leave **API Base URL** empty unless you are on a white-label domain. A custom base URL must be `https` and its path must be `/api/v1`.
5. Optional: set **Webhook Signing Secret** (16–256 characters). On save, the integration registers `POST /api/v1/webhooks` and checks `X-Famulor-Signature` (`sha256=` plus the HMAC-SHA256 hex digest of the raw body). Without a secret, point an assistant's unsigned Call completed webhook at the Botpress webhook URL instead.

The MCP endpoint `https://app.famulor.io/mcp` exposes the same customer-facing tools. This package does not call it.

## Actions

- `listAssistants` – `GET /assistants`
- `getAssistant` – `GET /assistants/{id}`
- `startOutboundCall` – `POST /calls`
- `listCalls` – `GET /calls`
- `getCall` – `GET /calls/{id}`
- `listConversationHistory` – `GET /history`
- `listLeads` – `GET /leads`
- `createLead` – `POST /leads`
- `listCampaigns` – `GET /campaigns`
- `getCampaign` – `GET /campaigns/{id}`
- `startCampaign` – `POST /campaigns/{id}/start`
- `stopCampaign` – `POST /campaigns/{id}/stop`

## Events

- `callCompleted` (`call.completed`)
- `conversationEnded` (`conversation.ended`)
- `bookingCreated` (`booking.created`)
- `bookingCancelled` (`booking.cancelled`)
- `bookingRescheduled` (`booking.rescheduled`)

Scoped keys need the matching `assistants`, `calls`, `leads`, and `campaigns` read or write scopes. Webhook registration needs `settings:write`, `calls:read`, and `bookings:read`. A key created in the dashboard is full access. `GET /me` is used to verify the key and needs no scope.

## Develop

From the repository root, after dependencies are installed and `@botpress/cli` is built:

```sh
pnpm --filter @botpresshub/famulor test
pnpm --filter @botpresshub/famulor check:type
pnpm --filter @botpresshub/famulor check:bplint
pnpm --filter @botpresshub/famulor build
```

Tests mock HTTP. No live API key is required.
