# Backend Push Notifications Implementation Plan

This document describes how the backend should support web push notifications for the Grails Market PWA. The frontend can request browser notification permission and create a Push API subscription, but the backend still needs to store subscriptions, manage user preferences, and deliver push payloads from the existing notification pipeline.

The backend source reviewed for this plan is `https://github.com/grailsmarket/backend` at commit `972cc94001af856d9926887aab21cedde5717450`.

## Goals

- Allow an authenticated user to enable or disable push notifications from the PWA.
- Store one or more browser push subscriptions per user, because users can install or open the PWA on multiple devices and browsers.
- Send push notifications from the existing backend notification flow instead of creating a parallel notification domain.
- Keep the existing in-app notification inbox as the canonical notification record.
- Remove expired or rejected subscriptions automatically when a push provider reports that a subscription is gone.

## Existing backend context

The backend is a Node 20+ TypeScript monorepo with separate API and worker services. The API uses Fastify, Zod validation, JWT authentication, PostgreSQL, and pg-boss jobs. Relevant files in the backend repository include:

- `services/api/src/index.ts` for Fastify bootstrap, plugins, error handling, and notification helper registration.
- `services/api/src/routes/index.ts` for route registration under `/api/v1`.
- `services/api/src/routes/auth.ts` and `services/api/src/middleware/auth.ts` for SIWE login and JWT request identity.
- `services/api/src/routes/users.ts` for authenticated profile APIs and user preference patterns.
- `services/api/src/routes/notifications.ts` for the in-app notification inbox.
- `services/api/src/routes/websocket.ts` for the existing `notification:unread` websocket bump.
- `services/api/src/queue.ts` and `services/workers/src/queue.ts` for pg-boss queue names and typed job contracts.
- `services/workers/src/workers/notifications.ts` for existing notification delivery behavior.
- `services/shared/src/config/index.ts` for environment parsing.
- `services/api/migrations/seq/` for sequential SQL migrations.

Authentication should use the existing `request.user.sub` value as the canonical user id. The auth flow upserts users by wallet address, but the JWT subject and existing user-owned tables use `users.id`, so push subscriptions should attach to `users.id` through a `user_id` foreign key.

## Data model

Add a new migration in `services/api/migrations/seq/` for `push_subscriptions`.

```sql
CREATE TABLE push_subscriptions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  expiration_time TIMESTAMPTZ NULL,
  device_name TEXT NULL,
  user_agent TEXT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_push_subscriptions_user_id
  ON push_subscriptions(user_id);

CREATE INDEX idx_push_subscriptions_enabled_user_id
  ON push_subscriptions(user_id)
  WHERE enabled = TRUE;
```

The browser Push API subscription object contains an `endpoint` and encryption keys under `keys.p256dh` and `keys.auth`. Storing these as explicit columns keeps delivery queries simple and avoids having the worker parse JSON for every notification. If the backend team wants to keep the original browser object for debugging, add a nullable `raw_subscription JSONB` column, but the worker should depend on the explicit columns above.

Do not replace the existing `notifications` table. Push is a delivery channel; the in-app notification row remains the durable notification record with metadata and read state.

## Environment configuration

Add Web Push VAPID settings to the shared config layer in `services/shared/src/config/index.ts` and the relevant `.env.example` files.

Recommended variables:

```env
WEB_PUSH_VAPID_PUBLIC_KEY=
WEB_PUSH_VAPID_PRIVATE_KEY=
WEB_PUSH_SUBJECT=mailto:support@grails.market
WEB_PUSH_TTL_SECONDS=86400
```

The public key is safe to expose through an authenticated or public API endpoint so the frontend can call `pushManager.subscribe({ applicationServerKey })`. The private key must only be available to the API/worker runtime.

## API endpoints

Register a new authenticated route file, for example `services/api/src/routes/push-subscriptions.ts`, from `services/api/src/routes/index.ts`.

Use the existing route style: Zod schemas, `request.user`, parameterized SQL, and the repository's `{ success, data, error }` response shape.

### `GET /api/v1/push/vapid-public-key`

Returns the VAPID public key used by the frontend to create a subscription.

Response:

```json
{
  "success": true,
  "data": {
    "publicKey": "..."
  }
}
```

This endpoint can be public, but it is also acceptable to require auth if the app only shows the enable-notifications option after login.

### `GET /api/v1/users/me/push-subscriptions`

Returns the current user's registered subscriptions, excluding secret key values from the response.

Response fields should include `id`, `endpoint`, `deviceName`, `enabled`, `lastSeenAt`, and `createdAt`.

### `POST /api/v1/users/me/push-subscriptions`

Creates or updates a subscription for the authenticated user.

Request body:

```json
{
  "endpoint": "https://push-service.example/...",
  "keys": {
    "p256dh": "...",
    "auth": "..."
  },
  "expirationTime": null,
  "deviceName": "Chrome on macOS"
}
```

Implementation notes:

- Validate `endpoint`, `keys.p256dh`, and `keys.auth` with Zod.
- Use `request.user.sub` as `user_id`.
- Upsert by `endpoint` so repeat registrations update the same row.
- If an endpoint already exists for another user, transfer it to the current user only if that matches the team's security expectations; the safer default is to overwrite `user_id` on login because browser push endpoints represent the current browser profile.
- Set `enabled = TRUE`, update keys, update `last_seen_at`, and update `user_agent` from request headers.

### `DELETE /api/v1/users/me/push-subscriptions/:id`

Deletes or disables one subscription owned by the authenticated user. A hard delete is acceptable because the browser can re-register. If analytics are needed, set `enabled = FALSE` instead.

### Optional: `PATCH /api/v1/users/me`

If the product needs a master account-level push toggle, add a boolean such as `push_notifications_enabled` to `users`. This should be separate from per-device `push_subscriptions.enabled`, because disabling one browser should not necessarily disable push on every device.

## Worker integration

Use the existing pg-boss notification worker path rather than creating a second notification queue from scratch.

Recommended implementation:

1. Add the `web-push` package to `services/workers` and configure it from the shared VAPID env values.
2. Extend the existing notification worker in `services/workers/src/workers/notifications.ts` so that, after it creates or resolves the notification content, it loads enabled push subscriptions for the recipient user ids.
3. Send one Web Push payload per enabled subscription.
4. If `web-push` returns `404` or `410`, mark the subscription disabled or delete it.
5. Log transient delivery failures but do not fail the entire notification job unless every channel fails and the job should retry.

Suggested payload shape:

```json
{
  "title": "Grails Market",
  "body": "You have a new notification",
  "url": "/notifications",
  "notificationId": 123,
  "type": "message",
  "metadata": {}
}
```

Keep payloads small and avoid sensitive content. A push notification can be displayed on a locked device, so the payload should contain only what is safe to show outside the app. The service worker can use `url` or `notificationId` to open the correct in-app destination after a click.

## Notification preference behavior

The backend already has user-level and watchlist-level notification preferences. Push delivery should respect the same event eligibility rules as the current notification system. In other words, do not send push for an event if the backend would not create an in-app notification for that user.

Recommended preference hierarchy:

1. Event-specific eligibility from the existing notification creation path.
2. Optional user-level `push_notifications_enabled` flag, if added.
3. Per-device `push_subscriptions.enabled` flag.

This allows a user to keep in-app notifications enabled while disabling browser push globally or only on a specific device.

## Frontend contract

The PWA frontend will need the following backend contract:

1. Fetch the VAPID public key.
2. Ask the browser for notification permission.
3. Register the service worker if needed.
4. Call `registration.pushManager.subscribe(...)`.
5. Send the resulting subscription to `POST /api/v1/users/me/push-subscriptions`.
6. Call `DELETE /api/v1/users/me/push-subscriptions/:id` or a disable endpoint when the user turns push off.

The frontend should not store VAPID private material and should not attempt to send push notifications directly.

## Testing checklist

Backend tests should cover:

- Auth is required for user subscription list/create/delete endpoints.
- A user can create a subscription and list only their own subscriptions.
- Re-posting the same endpoint updates keys and `last_seen_at` instead of creating duplicates.
- A user cannot delete another user's subscription.
- Invalid subscription payloads return validation errors.
- The worker sends push payloads to enabled subscriptions for eligible notifications.
- The worker disables or deletes subscriptions after `404` or `410` responses.
- Push delivery failures do not remove the canonical in-app notification record.

Manual QA should include Chrome and Safari where possible, because browser push behavior and PWA install flows differ by platform.

## Rollout plan

1. Add VAPID env variables and deploy configuration without enabling UI.
2. Add migration and API endpoints.
3. Add worker delivery behind a feature flag or env toggle if needed.
4. Add frontend UI for enabling push notifications.
5. Test with one internal account and one installed PWA device.
6. Enable for all users after confirming subscription registration, delivery, click-through, and expired-subscription cleanup.

## Open decisions

- Whether the VAPID public key endpoint should require authentication.
- Whether disabling push should hard-delete a subscription or retain it with `enabled = FALSE`.
- Whether to add a user-level `push_notifications_enabled` column or rely only on per-device subscriptions.
- Which notification types are safe to include detailed text for, versus generic copy like "You have a new notification".
