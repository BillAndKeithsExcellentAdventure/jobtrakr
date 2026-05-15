# Subscription and Entitlements

This document describes the plan for storing, resolving, and consuming subscription tier and entitlement data throughout the ProjectHound app.

---

## Overview

Subscription information is fetched from the backend after login and stored locally in the `appSettingsStore` TinyBase store. Two new tables — `subscriptionInformation` and `entitlements` — hold this data so all parts of the app can reactively read limits and feature flags without making repeated network calls.

The backend remains the source of truth. The local tables are a cache that is refreshed on app launch, after a successful purchase, and periodically in the background.

---

## Entitlement Definitions

```typescript
export const ENTITLEMENT = [
  // Feature flags (boolean — present = allowed)
  'allowQuickBooksSync',
  'allowChangeOrderEmails',
  'allowPublishPhotosAndVideos',
  'allowVendorPaymentReview',
  // -----------------------------------
  // Numeric limits
  'numProjects',
  'numOfficeExpenseProjects',
  'numProjectPhotos',
  'numProjectVideos',
  'numReceipts',
  'numBills',
  'numReceiptAiRequests',
  'numBillAiRequests',
  'numOrgUsers',
] as const;

export type Entitlement = (typeof ENTITLEMENT)[number];
```

## TinyBase Schema

Add the following two tables to `TABLES_SCHEMA` in `src/tbStores/appSettingsStore/appSettingsStore.tsx`:

```typescript
export const TABLES_SCHEMA = {
  settings: {
    /* existing columns — unchanged */
  },

  /**
   * Single-row table. Row ID is the orgId.
   * Holds subscription metadata cached from the backend.
   */
  subscriptionInformation: {
    tier: { type: 'string' }, // Latest known subscription tier, e.g. 'free' | 'basic' | 'premium'
    numReceiptAiRequestsRemaining: { type: 'number' }, // Server maintained value of count remaining
    numBillAiRequestsRemaining: { type: 'number' }, // Server maintained value of count remaining
    lastChecked: { type: 'number' }, // Unix timestamp (ms) of last successful backend refresh
    source: { type: 'string' }, // 'server' | 'fallback' | 'override'
  },

  /**
   * Multi-row table with one row per entitlement.
   * Row IDs match the keys in ENTITLEMENT.
   * e.g. { id: 'numProjects', kind: 'limit', numberValue: 5 }
   * e.g. { id: 'allowQuickBooksSync', kind: 'flag', booleanValue: true }
   */
  entitlements: {
    id: { type: 'string' }, // Entitlement key which is one of he property names in ENTITLEMENT constant.
    kind: { type: 'string' }, // Values are 'limit|flag'
    numberValue: { type: 'number', default: 0 }, // used when kind='limit'; -1 means unlimited
    booleanValue: { type: 'boolean', default: false }, // used when kind='flag'
  },
} as const;
```

> **Note:** `subscriptionInformation` is a single-row table keyed by `orgId`.  
> `entitlements` is a multi-row table keyed by entitlement name.

### `subscriptionInformation.source` values

`source` indicates where the currently stored subscription data came from.

- `server`: Data was fetched successfully from `GET /getOrgEntitlements` and written to TinyBase.
- `fallback`: A network/API refresh failed, so the app kept using the best local fallback.
  - If cached entitlement rows already exist, those cached values remain in use.
  - If no cached entitlement rows exist, code defaults (`DEFAULT_FREE_TIER_ENTITLEMENTS`) are written.
- `override`: Developer override is enabled (`useDevSubscriptionOverride === true`) in a development build, so values are sourced from `DEV_ENTITLEMENTS_BY_TIER` instead of the backend.

---

## Backend Endpoint

### `GET /getOrgEntitlements`

Returns the current subscription tier and all entitlement values for the authenticated organization. This is the sole source of data for both the `subscriptionInformation` and `entitlements` tables.

In addition, any backend endpoint that processes photos or invoices must also return the latest values for `numReceiptAiRequests` and `numBillAiRequests` in its response payload so the app can immediately update the local entitlement cache after each processing request.

**Authentication:** Required (Bearer JWT via `apiWithToken`)

**Query Parameters:**

| Parameter | Type   | Description                   |
| --------- | ------ | ----------------------------- |
| `orgId`   | string | Organization identifier       |
| `userId`  | string | Authenticated user identifier |

**Response:**

```json
{
  "success": true,
  "tier": "basic",
  "numReceiptAiRequestsRemaining": 22,
  "numBillAiRequestsRemaining": 35,
  "entitlements": {
    "allowQuickBooksSync": false,
    "allowChangeOrderEmails": false,
    "allowPublishPhotosAndVideos": true,
    "allowVendorPaymentReview": false,
    "numProjects": 10,
    "numOfficeExpenseProjects": 10,
    "numProjectPhotos": 200,
    "numProjectVideos": 20,
    "numReceipts": 500,
    "numBills": 500,
    "numReceiptAiRequests": 100,
    "numBillAiRequests": 100,
    "numOrgUsers": 5
  }
}
```

**Error Response:**

```json
{ "success": false, "error": "Unauthorized" }
```

> **Numeric limits:** A value of `-1` means unlimited.

### Processing Endpoint Requirement

Any endpoint that consumes an AI processing request for receipts or invoices must include the updated remaining request counts in its success response.

This applies to:

- photo-processing endpoints: must return the latest `numReceiptAiRequests`
- invoice-processing endpoints: must return the latest `numBillAiRequests`

If an endpoint can affect both counters, it must return both updated values.

Example response shape addition:

```json
{
  "success": true,
  "result": {},
  "updatedEntitlements": {
    "numReceiptAiRequests": 99,
    "numBillAiRequests": 100
  }
}
```

The app should treat these returned values as authoritative and immediately upsert them into the `entitlements` table without waiting for the next `GET /getOrgEntitlements` refresh.

### TypeScript Response Type

```typescript
export interface EntitlementsPayload {
  // Feature flags
  allowQuickBooksSync: boolean; // If true it allows user to connect ProjectHound to existing Quickbooks account. This allows receipts and bill entered into ProjectHound to be sent to QuickBooks.
  allowChangeOrderEmails: boolean; // If true an email can be sent to the Project Owner to summarize change orders and request approval.
  allowPublishPhotosAndVideos: boolean; // Allow user to publish specific project photos to web server so Project Owner can access photos as the project progresses.
  allowVendorPaymentReview: boolean; // Allow vendors to see that payment status of bills they have submitted from a custom web site.
  // Numeric limits (-1 = unlimited)
  numProjects: number; // this is number of 'regular' projects that can be created. A 'regular' project is one that is not set to be a 'CompanyExpenseProject'.
  numOfficeExpenseProjects: number; // This is a special type project that tracks company expenses. There can only be one active 'CompanyExpenseProject' at a time.
  numProjectPhotos: number; // Number of photos that can be saved for a specific project.
  numProjectVideos: number; // Number of videos that can be saved for a specific project.
  numReceipts: number; // Number of receipts that can be assigned to a specific project.
  numBills: number; // Number of bills that can be assigned to a specific project.
  numReceiptAiRequests: number; // Number of times receipt images can be processed to convert the image to line items and amounts per month.
  numBillAiRequests: number; // Number of times bill images can be processed to convert the image to line items and amounts per month.
  numOrgUsers: number; // Number of other users that can be invited to your organization so that project data can be synched with their mobile devices.
}

export interface GetOrgEntitlementsResponse {
  success: boolean;
  tier: SubscriptionTier;
  entitlements: EntitlementsPayload;
}
```

---

## Data Flow

```
GET /getOrgEntitlements
        │
        ▼
  refreshSubscription()  ──write──►  subscriptionInformation (tier, lastChecked, source)
                         ──write──►  entitlements rows      (one row per ENTITLEMENT key)
                                               │
                         ◄─── TinyBase reactive hooks ───────┘
                                               │
                         Components / business logic
```

1. On app launch or return to foreground, `refreshSubscription()` is called.
2. It calls `GET /getOrgEntitlements` via `apiWithToken`, passing `orgId` and `userId`.
3. On success it writes to `subscriptionInformation`:
   - `tier` — the subscription tier string from the response
   - `lastChecked` — `Date.now()`

- `source` — `'server'`

4. It then iterates over `ENTITLEMENT` and inserts one `entitlements` row per key.
5. Components read data exclusively through hooks (see below) — they never call the backend directly.
6. After every successful photo-processing or invoice-processing API request, the app reads the updated `numReceiptAiRequests` and/or `numBillAiRequests` returned by that endpoint and immediately updates the corresponding `entitlements` rows.

---

## Hooks Design

All hooks live in `src/tbStores/appSettingsStore/appSettingsStoreHooks.tsx`.

### Reading the subscription tier

```typescript
/**
 * Returns the effective subscription tier, respecting the dev override when
 * running a development build.
 */
export const useEffectiveSubscriptionTier = (): SubscriptionTier => { ... }
```

This replaces the existing hook of the same name. Instead of accepting a `backendTier` argument, it reads `subscriptionInformation.tier` from the store directly.

### Reading a numeric entitlement limit

```typescript
/**
 * Returns the numeric cap for a given entitlement, or -1 if unlimited.
 * Returns `null` while the store has not yet been populated.
 */
export const useEntitlementLimit = (key: EntitlementWithLimit): number | null => { ... }
```

### Checking a feature-flag entitlement

```typescript
/**
 * Returns true if the current subscription grants the given feature flag.
 * Reads from the `entitlements` table.
 */
export const useEntitlementFlag = (key: EntitlementFlag): boolean => { ... }
```

### Checking whether a limit has been reached

```typescript
/**
 * Returns true if the current count has reached or exceeded the allowed cap.
 * Pass the live count (e.g. number of projects in the store).
 */
export const useIsAtEntitlementLimit = (key: EntitlementWithLimit, currentCount: number): boolean => { ... }
```

### Refreshing from the backend

```typescript
/**
 * Returns a callback that fetches the latest subscription from the backend
 * and writes it into the store. Call on app launch and after purchases.
 */
export const useRefreshSubscription = (): (() => Promise<void>) => { ... }
```

---

## Developer Override

The existing `useDevSubscriptionOverride` and `devSubscriptionTier` fields in the `settings` table control the override. When `useDevSubscriptionOverride` is `true` **and** the app is a development build (`isDevelopmentBuild() === true`), the backend is not consulted — all entitlement data is resolved from a local constant instead.

### How it works

`refreshSubscription()` checks the flag before making any network call:

```
useDevSubscriptionOverride === true && isDevelopmentBuild()
          │
          ▼
  look up DEV_ENTITLEMENTS_BY_TIER[devSubscriptionTier]
  write result into subscriptionInformation + entitlements
  (no network call is made)
```

All hooks (`useEffectiveSubscriptionTier`, `useEntitlementFlag`, `useEntitlementLimit`) then read from the store as normal — they are unaware of whether the data came from the backend or the local override.

### `DEV_ENTITLEMENTS_BY_TIER` constant

Define this constant in `appSettingsStoreHooks.tsx` alongside the existing `PHOTO_LIMIT_PER_PROJECT_BY_TIER`. It maps every `SubscriptionTier` to a full `EntitlementsPayload` so developers can test any tier without a live backend:

```typescript
export const DEV_ENTITLEMENTS_BY_TIER: Record<SubscriptionTier, EntitlementsPayload> = {
  free: {
    allowQuickBooksSync: true,
    allowChangeOrderEmails: true,
    allowPublishPhotosAndVideos: true,
    allowVendorPaymentReview: true,
    numProjects: 1,
    numOfficeExpenseProjects: 1,
    numProjectPhotos: 10,
    numProjectVideos: 2,
    numReceipts: 20,
    numBills: 10,
    numReceiptAiRequests: 5,
    numBillAiRequests: 5,
    numOrgUsers: 2,
  },
  basic: {
    allowQuickBooksSync: false,
    allowChangeOrderEmails: false,
    allowPublishPhotosAndVideos: true,
    allowVendorPaymentReview: false,
    numProjects: -1,
    numOfficeExpenseProjects: 10,
    numProjectPhotos: 500,
    numProjectVideos: 20,
    numReceipts: 1000,
    numBills: 1000,
    numReceiptAiRequests: 100,
    numBillAiRequests: 100,
    numOrgUsers: 3,
  },
  premium: {
    allowQuickBooksSync: true,
    allowChangeOrderEmails: true,
    allowPublishPhotosAndVideos: true,
    allowVendorPaymentReview: true,
    numProjects: -1,
    numOfficeExpenseProjects: 10,
    numProjectPhotos: 3000,
    numProjectVideos: -1,
    numReceipts: -1,
    numBills: -1,
    numReceiptAiRequests: -1,
    numBillAiRequests: -1,
    numOrgUsers: -1,
  },
};
```

> `-1` means unlimited.

### Toggling the override

The developer toggles `useDevSubscriptionOverride` and selects `devSubscriptionTier` in the in-app developer settings screen. Changing either value should trigger a re-run of `refreshSubscription()` so the store is immediately updated with the new override values without requiring an app restart.

---

## Refresh Strategy

| Trigger                                     | Action                                             |
| ------------------------------------------- | -------------------------------------------------- |
| App launch (foreground)                     | Call `useRefreshSubscription()` in the root layout |
| Returning to foreground (`AppState change`) | Refresh if `lastChecked` is more than 1 hour old   |
| After in-app purchase                       | Force refresh immediately                          |
| Manual (settings screen)                    | Expose a "Refresh" button that calls the hook      |

The `lastChecked` timestamp stored in `subscriptionInformation` is used to avoid redundant network calls.

---

## Enforcement Points

Entitlement checks should be performed at the point of creating, not just displaying:

| Entitlement                   | Enforced in                                                              |
| ----------------------------- | ------------------------------------------------------------------------ |
| `numProjects`                 | "New Project" action — check before creating                             |
| `numOfficeExpenseProjects`    | "New Project" action — check before creating                             |
| `numProjectPhotos`            | Camera capture / image picker — check before adding                      |
| `numProjectVideos`            | Video capture / picker — check before adding                             |
| `numReceipts`                 | "Add Receipt" action                                                     |
| `numBills`                    | "Add Invoice" action                                                     |
| `numReceiptAiRequests`        | AI photo processing queue — gate submission                              |
| `numBillAiRequests`           | AI invoice processing queue — gate submission                            |
| `numOrgUsers`                 | Org member invite — check before sending invite                          |
| `allowQuickBooksSync`         | QuickBooks setup screen — hide/disable option                            |
| `allowChangeOrderEmails`      | Change order email send button                                           |
| `allowPublishPhotosAndVideos` | Publish photos/videos action                                             |
| `allowVendorPaymentReview`    | Vendors screen only — enable email verification and Grant Access actions |

When `allowVendorPaymentReview` is `false`, the Vendors screen must not show or invoke:

- vendor email verification actions
- `grantVendorAccess` calls

For `numReceiptAiRequests` and `numBillAiRequests`, enforcement must happen in two places:

- before submission: block the request if the count is already exhausted
- after success: replace the local cached count with the updated value returned by the backend response

---

## Implementation Checklist

- [ ] Add `subscriptionInformation` and `entitlements` tables to `TABLES_SCHEMA` in `appSettingsStore.tsx`
- [ ] Define `ENTITLEMENT`, `ENTITLEMENT_WITH_LIMITS`, `EntitlementsPayload` types in `src/models/types.ts`, including `numOfficeExpenseProjects`
- [ ] Implement `useRefreshSubscription` hook using `apiWithToken`
- [ ] Implement `useEntitlementLimit`, `useEntitlementFlag`, `useIsAtEntitlementLimit` hooks
- [ ] Update `useEffectiveSubscriptionTier` to read from the store instead of accepting a parameter
- [ ] Define `DEV_ENTITLEMENTS_BY_TIER` for dev override support
- [ ] Call `useRefreshSubscription` on app launch in the root protected layout
- [ ] Add `AppState` listener to refresh when stale (> 1 hour since `lastChecked`)
- [ ] Add enforcement checks at each creation action listed above
- [ ] Add unit tests in `__tests__/tbStores/` covering:
  - Dev override entitlements
  - Limit check at boundary conditions
  - JSON parse safety for `entitlements` cell
