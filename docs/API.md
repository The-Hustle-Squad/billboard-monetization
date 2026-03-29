# VacantSlot API — full reference

**OpenAPI UI:** `{origin}/docs`  
**OpenAPI JSON:** `{origin}/docs-json`

Default **path prefix:** `/api/v1` (env `API_PREFIX`). All routes below assume that prefix unless noted. Swagger UI and JSON are mounted at **`/docs`** and **`/docs-json`** (no API prefix).

---

## Conventions

| Item | Value |
|------|--------|
| Format | JSON |
| Charset | UTF-8 |
| Request header | `Content-Type: application/json` for bodies |
| Auth header | `x-api-key: <uuid>` on every route **except** `POST /vendors` |

---

## Success & error envelope

### Success

Responses use the HTTP status documented per route (`200`, `201`). Bodies are JSON as specified below. **Date** fields are serialized as **ISO 8601** strings in JSON (e.g. `"2026-04-01T10:00:00.000Z"`).

### Global error shape (`HttpExceptionFilter`)

All thrown HTTP exceptions are JSON with at least:

```json
{
  "statusCode": 400,
  "message": "string or array of validation messages",
  "timestamp": "2026-03-29T12:00:00.000Z",
  "path": "/api/v1/slots/sync"
}
```

- Nest may add `"error": "Bad Request"` / `"Unauthorized"` / etc. on some responses; the filter merges the exception body and **always** adds `timestamp` and `path`.
- **`message`** is a **string** for single errors, or an **array of strings** for validation failures.

### Validation errors (`400`)

`ValidationPipe` is global: `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`.

Typical `400` body:

```json
{
  "statusCode": 400,
  "message": [
    "property unexpectedField should not exist",
    "name must be a string",
    "slots must contain at least 1 elements"
  ],
  "error": "Bad Request",
  "timestamp": "2026-03-29T12:00:00.000Z",
  "path": "/api/v1/vendors"
}
```

Handle **`message` as `string | string[]`** on the client.

### Authentication errors (`401`)

Thrown by `ApiKeyGuard` when the route is not `@Public()`:

| Condition | `statusCode` | `message` (exact string from code) |
|-----------|----------------|-------------------------------------|
| Missing or non-string `x-api-key` | `401` | `x-api-key header is required` |
| Key not found in DB | `401` | `Invalid API key` |

Example:

```json
{
  "statusCode": 401,
  "message": "Invalid API key",
  "error": "Unauthorized",
  "timestamp": "2026-03-29T12:00:00.000Z",
  "path": "/api/v1/slots"
}
```

### Server errors (`500`)

Unhandled errors return `500` with `message: "Internal server error"` (string) plus `timestamp` and `path`. Examples: DB down, Redis down, unhandled exceptions. **Not** enumerated per route in application code.

---

## DTO validation rules (reference)

Use this to anticipate `400` validation failures without relying on exact wording (class-validator messages can vary slightly by version).

### `POST /vendors` — `CreateVendorDto`

| Field | Rules |
|-------|--------|
| `name` | Required, non-empty string |
| `vacancyThresholdHours` | Optional, number ≥ 1 |
| `discountBuckets` | Optional array of `{ hoursBefore` (≥ 1), `discountPercent` (0–100) } |
| `maxDiscountPercent` | Optional, 0–100 |
| `minPrice` | Optional, ≥ 0 |
| `lockTtlMinutes` | Optional, ≥ 1 |

### `POST /vendors/rules` — `UpdateRulesDto`

All fields optional; same numeric ranges as above where applicable. At least one field should be sent for a meaningful update (not enforced by API — empty `{}` is valid JSON).

### `POST /slots/sync` — `SyncSlotsDto`

| Field | Rules |
|-------|--------|
| `slots` | Required array, **min length 1** |
| Each item `slotId` | Non-empty string |
| `startTime`, `endTime` | Strict ISO 8601 strings |
| `basePrice` | Number ≥ 0 |

### `POST /slots/:slotId/confirm` — `ConfirmSlotDto`

| Field | Rules |
|-------|--------|
| `lockId` | UUID **version 4** |

### `GET /slots` — query

| Query | Rules |
|-------|--------|
| `page` | Optional integer ≥ 1 (default `1`) |
| `limit` | Optional integer 1–100 (default `20`) |

---

## Endpoints

---

### 1. Register vendor

**`POST /api/v1/vendors`**

- **Auth:** none (`@Public()`).

#### Request body

```json
{
  "name": "Acme Billboards",
  "vacancyThresholdHours": 48,
  "discountBuckets": [
    { "hoursBefore": 24, "discountPercent": 10 },
    { "hoursBefore": 6, "discountPercent": 25 }
  ],
  "maxDiscountPercent": 50,
  "minPrice": 10,
  "lockTtlMinutes": 15
}
```

Minimal valid body:

```json
{
  "name": "Acme Billboards"
}
```

Defaults applied server-side when omitted: `vacancyThresholdHours` **72**, `discountBuckets` **[]**, `maxDiscountPercent` **100**, `minPrice` **0**, `lockTtlMinutes` **15**.

#### Success — `201 Created`

```json
{
  "_id": "67ed2f1a2b3c4d5e6f708192",
  "name": "Acme Billboards",
  "apiKey": "550e8400-e29b-41d4-a716-446655440000",
  "vacancyThresholdHours": 48,
  "discountBuckets": [
    { "hoursBefore": 24, "discountPercent": 10 },
    { "hoursBefore": 6, "discountPercent": 25 }
  ],
  "maxDiscountPercent": 50,
  "minPrice": 10,
  "lockTtlMinutes": 15,
  "createdAt": "2026-03-29T12:00:00.000Z",
  "updatedAt": "2026-03-29T12:00:00.000Z"
}
```

**Important:** `apiKey` is returned **only on create**. Store it securely.

#### Business errors — `400` (`VendorService.validateBuckets` / create)

| `message` (exact) |
|-------------------|
| `Discount buckets must not contain duplicate hoursBefore values` |
| `hoursBefore must be greater than 0` |
| `Bucket discountPercent (<n>) exceeds maxDiscountPercent (<m>)` |

#### Other errors

| Status | Cause |
|--------|--------|
| `400` | Validation / unknown properties (`forbidNonWhitelisted`) |
| `500` | DB / unhandled (e.g. duplicate `apiKey` collision is extremely unlikely with UUID) |

---

### 2. Update vendor pricing rules

**`POST /api/v1/vendors/rules`**

- **Auth:** `x-api-key` required.

#### Request body (all optional)

```json
{
  "vacancyThresholdHours": 48,
  "discountBuckets": [
    { "hoursBefore": 24, "discountPercent": 10 }
  ],
  "maxDiscountPercent": 50,
  "minPrice": 10,
  "lockTtlMinutes": 15
}
```

#### Success — `200 OK`

```json
{
  "_id": "67ed2f1a2b3c4d5e6f708192",
  "name": "Acme Billboards",
  "vacancyThresholdHours": 48,
  "discountBuckets": [
    { "hoursBefore": 24, "discountPercent": 10 }
  ],
  "maxDiscountPercent": 50,
  "minPrice": 10,
  "lockTtlMinutes": 15,
  "updatedAt": "2026-03-29T12:30:00.000Z"
}
```

#### Business errors — `400`

Same bucket validation messages as vendor create:

| `message` (exact) |
|-------------------|
| `Discount buckets must not contain duplicate hoursBefore values` |
| `hoursBefore must be greater than 0` |
| `Bucket discountPercent (<n>) exceeds maxDiscountPercent (<m>)` |

#### Other errors

| Status | Cause |
|--------|--------|
| `400` | Validation |
| `401` | Missing/invalid API key |
| `500` | DB / unhandled |

---

### 3. Sync slots (upsert inventory)

**`POST /api/v1/slots/sync`**

- **Auth:** `x-api-key` required.

#### Request body

```json
{
  "slots": [
    {
      "slotId": "slot-abc-123",
      "startTime": "2026-04-01T10:00:00.000Z",
      "endTime": "2026-04-01T11:00:00.000Z",
      "basePrice": 99.99
    }
  ]
}
```

#### Success — `200 OK`

```json
{
  "created": 1,
  "updated": 0,
  "skipped": 0
}
```

- **`created`:** new documents inserted.  
- **`updated`:** existing slot updated (not booked).  
- **`skipped`:** slot exists and status is **`booked`** (no update).

#### Business errors — `400`

| `message` (exact pattern) |
|---------------------------|
| `Slot <slotId>: endTime must be after startTime` |

Example:

```json
{
  "statusCode": 400,
  "message": "Slot slot-abc-123: endTime must be after startTime",
  "timestamp": "...",
  "path": "/api/v1/slots/sync"
}
```

#### Other errors

| Status | Cause |
|--------|--------|
| `400` | Validation |
| `401` | Missing/invalid API key |
| `500` | DB / unhandled |

---

### 4. List slots (paginated)

**`GET /api/v1/slots?page=1&limit=20`**

- **Auth:** `x-api-key` required.
- **Ordering:** `startTime` **descending** (newest window first).
- **Defaults:** `page=1`, `limit=20`. **Max** `limit=100` (values are clamped server-side).

#### Success — `200 OK`

```json
{
  "items": [
    {
      "_id": "67ed2f1a2b3c4d5e6f708193",
      "slotId": "slot-abc-123",
      "startTime": "2026-04-01T10:00:00.000Z",
      "endTime": "2026-04-01T11:00:00.000Z",
      "basePrice": 99.99,
      "status": "available",
      "lockId": null,
      "lockedUntil": null,
      "bookedAt": null,
      "discountApplied": null,
      "finalPrice": null,
      "createdAt": "2026-03-29T12:00:00.000Z",
      "updatedAt": "2026-03-29T12:00:00.000Z"
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 20,
  "totalPages": 3
}
```

**`status` enum:** `available` | `locked` | `booked` | `expired` (see slot schema usage).

#### Errors

| Status | Cause |
|--------|--------|
| `400` | Invalid query validation (`page` / `limit` out of range) |
| `401` | Missing/invalid API key |
| `500` | DB / unhandled |

No `404` for empty list — `items: []`, `total: 0`, `totalPages: 0`.

---

### 5. Get pricing for a slot

**`GET /api/v1/slots/:slotId/pricing`**

- **Auth:** `x-api-key` required.
- **Path:** `slotId` = external slot identifier (URL-encoded if needed).

#### Success — `200 OK`

```json
{
  "originalPrice": 100,
  "finalPrice": 85,
  "discountPercent": 15,
  "validUntil": "2026-03-30T10:00:00.000Z"
}
```

#### Errors

| Status | `message` (exact) | When |
|--------|-------------------|------|
| `404` | `Slot '<slotId>' not found` | No slot for this vendor + `slotId` |
| `400` | `Slot has expired` | `endTime <= now` |
| `409` | `Slot is already booked` | `status === 'booked'` |
| `409` | `Slot is currently locked` | Locked and `lockedUntil > now` |
| `401` | `x-api-key header is required` / `Invalid API key` | Auth |
| `400` | (validation) | Rare if `slotId` is only path param |
| `500` | Internal | DB / unhandled |

---

### 6. Lock slot (before confirm)

**`POST /api/v1/slots/:slotId/lock`**

- **Auth:** `x-api-key` required.
- **Body:** none.

#### Success — `200 OK`

```json
{
  "lockId": "6ba7b810-9dad-11d1-80b4-00c04fd430c8"
}
```

`lockId` is UUID v4; use it in **`POST .../confirm`**.

#### Errors

| Status | `message` (exact) | When |
|--------|-------------------|------|
| `404` | `Slot '<slotId>' not found` | — |
| `400` | `Slot has expired` | `endTime <= now` |
| `409` | `Slot is already booked` | Already booked |
| `409` | `Slot is currently locked by another party` | Slot row locked and lock still valid |
| `409` | `Failed to acquire lock — slot is already locked` | Redis lock not acquired (contention) |
| `401` | Missing/invalid API key | — |
| `500` | Internal | DB / Redis / unhandled |

---

### 7. Confirm booking

**`POST /api/v1/slots/:slotId/confirm`**

- **Auth:** `x-api-key` required.

#### Request body

```json
{
  "lockId": "6ba7b810-9dad-11d1-80b4-00c04fd430c8"
}
```

Must be **UUID v4** (`@IsUUID('4')`).

#### Success — `200 OK`

```json
{
  "success": true
}
```

**Idempotency:** If the slot is already **`booked`** and `slot.lockId === body.lockId`, the handler returns **`200`** with `{ "success": true }` without error.

#### Errors

| Status | `message` (exact) | When |
|--------|-------------------|------|
| `404` | `Slot '<slotId>' not found` | — |
| `409` | `Slot is already booked with a different lock` | Booked, different `lockId` |
| `400` | `Slot is not in a locked state` | e.g. `available` / `expired` |
| `400` | `Invalid lockId` | Locked but `lockId` does not match |
| `400` | (validation) | `lockId` missing or not UUID v4 |
| `401` | Missing/invalid API key | — |
| `500` | Internal | DB / unhandled |

---

### 8. Analytics summary

**`GET /api/v1/analytics/summary`**

- **Auth:** `x-api-key` required.

#### Success — `200 OK`

```json
{
  "totalSlots": 100,
  "bookedSlots": 30,
  "recoveredSlots": 12,
  "recoveredRevenue": 4500.5
}
```

- **`recoveredSlots`:** booked slots with `discountApplied > 0`.  
- **`recoveredRevenue`:** sum of `finalPrice` for those rows.

#### Errors

| Status | Cause |
|--------|--------|
| `401` | Missing/invalid API key |
| `500` | DB / unhandled |

---

## Recommended client handling matrix

| `statusCode` | Client action |
|--------------|----------------|
| `200` / `201` | Parse body per route |
| `400` | Show validation messages; for sync, show single string for `endTime` / `startTime` |
| `401` | Clear stored key / prompt re-auth |
| `404` | Slot or resource missing — refresh list |
| `409` | Retry or show “already booked / locked” per `message` |
| `500` | Retry with backoff; show generic error |

---

## Booking flow (happy path)

1. `GET /api/v1/slots/:slotId/pricing` → ensure not `404`/`400`/`409`.  
2. `POST /api/v1/slots/:slotId/lock` → store `lockId`.  
3. `POST /api/v1/slots/:slotId/confirm` with `{ "lockId" }` → `{ "success": true }`.

If step 3 fails with `409` / `400`, do not assume the booking completed; re-fetch slot status or list.

---

*Generated from application code in this repository. For schema details, prefer `/docs-json` for codegen.*
