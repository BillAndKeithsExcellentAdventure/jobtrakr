# Receipt Queue Processing

This document describes how Jobtrakr posts (copies) receipts to **all projects referenced by the receipt’s line items**, and how the system queues, processes, and finalizes those copies.

## High-level behavior

When a receipt is created/edited in a way that includes line items for other projects, Jobtrakr places a record into the **Receipt Queue**. A background processor then:

1. Determines the set of **target projects** from the receipt’s `lineItems[].projectId`
2. Excludes the origin project (`fromProjectId`)
3. For each remaining target project:
   - Creates a new receipt row in that project
   - Creates work-item cost entries for that project’s line items
   - Duplicates the receipt image into that project (if the receipt has an `imageId`)
4. Deletes the queued entry once all target projects have been processed successfully

The processor is designed to be safe to run during the entire app lifecycle and to avoid doing work when offline.

## Key concepts and data flow

### Receipt queue entry

A queued receipt is stored in a TinyBase table named `receiptQueueEntries`. Each queue row includes:

- `purchaseId`: the original purchase/receipt identifier
- `fromProjectId`: the project where the receipt originated
- `imageId` (optional): the backing image identifier (if present)
- `lineItems`: a JSON-stringified array of line items

### Line items drive posting

Each receipt line item contains:

- `projectId`: the project that should receive that portion of the receipt
- `workItemId`: the work item to attach the cost entry to
- `amount`, `itemDescription`

**Posting rule:**
- The receipt is posted to **ALL distinct `lineItems[].projectId`** values
- The origin project (`fromProjectId`) is **excluded**
- If there are **no target projects** (i.e., every line item is for `fromProjectId` or missing `projectId`), the queue entry is removed as “nothing to do”

## Processing implementation (where to look)

### Enabling processing in the app

Receipt queue processing is enabled by rendering:

- `src/components/ReceiptQueueProcessor.tsx`

This component renders `null` but calls the hook below so processing runs during the app lifecycle.

### The processor hook

The core logic lives in:

- `src/hooks/useReceiptQueue.tsx`

Key behaviors implemented there:

- Computes target project IDs from `lineItems[].projectId` (excluding `fromProjectId`)
- Ensures those projects are marked as “active” (so their stores can be loaded)
- Skips processing when offline (uses `NetworkContext`)
- Retrieves each target project’s TinyBase store via the cache (see below)
- Writes:
  - a new receipt row into the target project’s `receipts` table
  - corresponding `workItemCostEntries` rows for line items belonging to that project
- Duplicates receipt images per target project using `useDuplicateReceiptImageCallback`
- Deletes processed queue entries in a batch once complete

### Project store access (cache)

To post into multiple projects, processing needs access to each project’s store. This is provided by:

- `src/context/ProjectDetailsStoreCacheContext.tsx`

The queue processor calls `getStoreFromCache(projectId)` for each target project. If a store is not yet available, processing logs a warning and retries (up to a bounded number of attempts for that cycle).

### Queue storage (TinyBase)

Queue persistence and schema are defined in:

- `src/tbStores/ReceiptQueueStore.tsx`
- `src/tbStores/ReceiptQueueStoreHooks.tsx`

`ReceiptQueueStoreHooks.tsx` defines the `ReceiptQueueEntry` / `ReceiptLineItem` structures and helper functions for serializing/deserializing line items.

## Edge cases / operational notes

- **Offline:** Processing is skipped when the device is offline to avoid failing network-dependent operations (such as image duplication).
- **Missing target stores:** If a target project’s store is not yet loaded, the processor will retry later.
- **Partial failure:** If one or more projects fail during processing, the queue entry is not deleted (so it can retry later).
- **Image duplication:** Receipt image duplication is best-effort; failures are logged and do not necessarily block receipt posting.

## Summary

Receipts are posted to every project referenced by the receipt’s line items (`lineItems[].projectId`), excluding the origin (`fromProjectId`). The receipt queue mechanism ensures these cross-project postings happen asynchronously and safely across connectivity conditions, and it centralizes retries when dependent project stores are not yet loaded.