# Receipt Processing and Receipt Queue

This document describes the end-to-end receipt lifecycle in Jobtrakr, including:

- local receipt and line item updates
- QuickBooks synchronization
- multi-project propagation through the Receipt Queue
- current safety restrictions for QuickBooks-synced receipts

## Receipt Processing Overview

At a high level, receipt processing has two related workflows:

1. **QuickBooks workflow**
2. **Cross-project workflow**

### 1) QuickBooks workflow

When a receipt is synced to QuickBooks from the receipt details screen:

- If the receipt has no `purchaseId`, Jobtrakr creates a new QuickBooks Purchase and stores:
  - `purchaseId` (QuickBooks Purchase ID)
  - `accountingId` (doc number when available)
  - `qbSyncHash` (hash of receipt + line item state)
- If the receipt already has a `purchaseId`, Jobtrakr updates the existing QuickBooks Purchase.

After a receipt has a `purchaseId`, Jobtrakr treats it as QuickBooks-synced and applies additional edit/delete rules (documented below).

### 2) Cross-project workflow

Line items can belong to other projects by setting `workItemCostEntries.projectId` to a project different from the current route project.

When a synced or newly synced receipt contains line items for other projects, Jobtrakr creates a queue entry so those other projects can receive the receipt representation and line items locally.

The queue processor runs in the foreground app lifecycle and applies queued updates to target project stores.

## Where This Is Implemented

- Receipt details and QuickBooks sync actions:
  - `src/app/(protected)/(home)/[projectId]/receipt/[receiptId]/index.tsx`
- Receipt detail editing with auto-sync for synced receipts:
  - `src/app/(protected)/(home)/[projectId]/receipt/[receiptId]/edit.tsx`
- Add line item flow (including queue enqueue for cross-project additions):
  - `src/app/(protected)/(home)/[projectId]/receipt/[receiptId]/addLineItem.tsx`
- Edit line item restrictions for synced cross-project items:
  - `src/app/(protected)/(home)/[projectId]/receipt/[receiptId]/[lineItemId]/index.tsx`
- Queue processor:
  - `src/hooks/useReceiptQueue.tsx`
- Queue storage/hooks:
  - `src/tbStores/ReceiptQueueStore.tsx`
  - `src/tbStores/ReceiptQueueStoreHooks.tsx`
- Processor bootstrap component:
  - `src/components/ReceiptQueueProcessor.tsx`

## Receipt Queue Data Model

Queue rows are stored in TinyBase `receiptQueueEntries` and include:

- `purchaseId`
- `fromProjectId`
- `vendor`, `vendorId`
- `paymentAccountId`, `accountingId`
- `description`, `receiptDate`, `pictureDate`, `notes`
- `thumbnail`, `imageId` (optional)
- `qbSyncHash`
- `lineItems` (serialized array)

Each queued line item includes:

- `projectId`
- `workItemId`
- `amount`
- `itemDescription`

## Queue Processing Capabilities (Current)

### 1) Target project selection

For each queue entry, the processor:

- builds distinct target project IDs from `lineItems[].projectId`
- excludes `fromProjectId`
- removes queue entries immediately when no target projects remain

### 2) Store readiness and network guards

Before processing:

- waits for auth (`userId`, `orgId`)
- skips while offline (`isConnected` and `isInternetReachable`)
- requires target project stores to exist in `ProjectDetailsStoreCacheContext`

If required stores are missing, the queue entry is left in queue for retry.

### 3) Merge-by-purchaseId behavior (new)

Queue processing now supports **create-or-merge** in target projects:

- looks for existing receipt in target project where `receipts.purchaseId === queuedReceipt.purchaseId`
- if found: updates/merges into existing receipt
- if not found: creates a new receipt row

This prevents duplicate target receipts when additional cross-project line items are added later.

### 4) Line item upsert and dedupe (new)

When merging, the processor dedupes line items by a composite key:

- `label|amount|workItemId|projectId`

Only missing entries are inserted. Existing entries are preserved.

### 5) Receipt amount recalculation (new)

After create/merge, the processor recalculates target receipt `amount` from all attached `workItemCostEntries` for that receipt.

### 6) Conditional image duplication (new)

Image duplication now runs only when a new target receipt row is created.

- new receipt: try to duplicate image
- merge into existing receipt: skip image duplication

This avoids unnecessary duplicate image operations during merge updates.

## Editing and Sync Rules for QuickBooks-Synced Receipts

### 1) Receipt-level detail edits

In the receipt edit screen, if `purchaseId` exists:

- changes to amount/date/vendor/payment account/notes/description trigger `editReceiptInQuickBooks`
- QuickBooks update sends the full current line item set for that receipt
- local `qbSyncHash` is refreshed after successful update

### 2) Line item edit restrictions (new)

When editing a receipt line item:

- if receipt has `purchaseId` and line item belongs to a different project, it is read-only in this project
- project reassignment is disabled once `purchaseId` exists
- user is instructed to open the owning project to edit that line item

### 3) Adding line items to synced receipts (new)

Adding new line items is allowed even when `purchaseId` exists:

- same-project addition: updates QuickBooks Purchase with full line set
- cross-project addition:
  - enqueues a receipt queue entry
  - updates QuickBooks Purchase with full line set
  - queue later creates/merges local projection in target project

### 4) Deletion safeguards (new)

- synced receipts (`purchaseId` present) cannot be deleted from receipt list UI
- synced cross-project line items cannot be deleted from a non-owning project
- for synced receipts, current project cannot delete its last remaining line item

## QuickBooks Sync Semantics

QuickBooks updates are full-set updates for receipt line items in the current implementation:

- any sync action builds QB line items from all receipt line items available in that project store
- each QB line item resolves expense account via work item/account config
- line items missing account resolution are skipped from QB payload

This design simplifies consistency by treating updates as replacement-style payloads rather than per-line deltas.

## Failure and Retry Behavior

- queue entries are deleted only after all target projects for that entry complete successfully
- partial failure keeps entry in queue for next processing cycle
- missing stores or offline status defer processing
- image duplication is best-effort and logged

## Practical Multi-Project Example

1. User syncs Receipt A in Project X to QuickBooks.
2. Receipt A now has `purchaseId`.
3. User adds a new line item for Project Y.
4. App updates QuickBooks Purchase for Receipt A.
5. App enqueues receipt queue entry for cross-project propagation.
6. Queue processor runs:
   - finds Project Y target store
   - finds existing receipt by `purchaseId` (if any)
   - creates or merges receipt + line items
   - recalculates target receipt amount
   - duplicates image only if a new target receipt was created
7. Queue entry is removed after success.

## Summary

Receipt processing now supports stable multi-project synchronization by combining:

- QuickBooks Purchase create/update using full line-item payloads
- queue-based cross-project propagation
- merge-by-purchaseId queue processing to prevent duplicates
- UI safeguards that enforce project-specific ownership for synced line items
