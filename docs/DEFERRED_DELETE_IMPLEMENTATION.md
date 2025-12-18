# Deferred Delete Media Implementation

## Overview

This document describes the implementation of deferred delete media processing, which allows the app to queue media deletion requests when the device is offline and process them when network connectivity is restored.

## Problem Statement

Previously, when a user attempted to delete media (photos/videos) without network connectivity, the delete operation would fail immediately without any retry mechanism. Additionally, if an image was queued for upload (in the `failedToUpload` table) but never uploaded, deleting it would still attempt an API call to the server.

## Solution

The implementation adds a new `failedToDelete` table to track delete operations that need to be retried, and updates the `useUploadQueue` hook to process both upload and delete queues.

## Architecture

### 1. New `failedToDelete` Table

Added to `UploadSyncStore` with the following schema:

```typescript
failedToDelete: {
  id: { type: 'string' },
  organizationId: { type: 'string' },
  projectId: { type: 'string' },
  imageIds: { type: 'string' },        // JSON string array
  imageType: { type: 'string' },
  deleteDate: { type: 'number' },
}
```

### 2. New Hook: `useDeleteMediaCallback`

Created in `src/utils/images.tsx`, this hook provides a network-aware delete callback that:

1. **Checks `failedToUpload` table first**: If any of the images being deleted are in the upload queue (never uploaded to server), it returns success without making an API call
2. **Handles offline scenarios**: If the device is offline, the delete request is queued in the `failedToDelete` table
3. **Handles API failures**: If the delete API call fails, the request is queued for retry
4. **Handles online scenarios**: If online, attempts immediate deletion via API

### 3. Updated `useUploadQueue` Hook

The existing upload queue processor was extended to also process delete operations:

- Now imports `useAllFailedToDelete` and `deleteMedia`
- Processes both `failedToUpload` and `failedToDelete` queues
- Returns total count of both upload and delete items pending
- Runs every hour when network is available
- Processes uploads first, then deletes

### 4. Component Updates

Three components were updated to use the new hook:

#### SwipeableReceiptItem
- Uses `useDeleteMediaCallback` instead of direct `deleteMedia` call
- Checks if image is in `failedToUpload` queue
- If in upload queue, removes it from queue without API call
- Otherwise, uses the callback which handles network-aware deletion

#### SwipeableInvoiceItem
- Same pattern as SwipeableReceiptItem
- Handles invoice image deletion with network awareness

#### ProjectMediaList
- Bulk delete operation with network awareness
- Checks all selected images against `failedToUpload` queue
- Removes queued images from `failedToUpload` table
- Only calls API for images that were successfully uploaded

## Flow Diagrams

### Delete Flow - Online

```
User deletes media
  ↓
useDeleteMediaCallback checks failedToUpload
  ↓
Images NOT in upload queue
  ↓
Network is available
  ↓
Call deleteMedia API
  ↓
Success: Remove from local store
Failure: Queue in failedToDelete
```

### Delete Flow - Offline

```
User deletes media
  ↓
useDeleteMediaCallback checks failedToUpload
  ↓
Images NOT in upload queue
  ↓
Network is NOT available
  ↓
Add to failedToDelete queue
  ↓
Remove from local store
  ↓
Return success (queued)
```

### Delete Flow - Image in Upload Queue

```
User deletes media
  ↓
useDeleteMediaCallback checks failedToUpload
  ↓
Images ARE in upload queue
  ↓
Remove from failedToUpload queue
  ↓
Remove from local store
  ↓
Return success (no API call needed)
```

### Queue Processing

```
Every hour (or when network restored)
  ↓
Check network status
  ↓
If online:
  ↓
  Process all failedToUpload items
  ↓
  Process all failedToDelete items
  ↓
  Remove successful operations from queues
```

## Benefits

1. **Offline resilience**: Users can delete media even when offline
2. **No unnecessary API calls**: Images that never uploaded don't trigger delete API calls
3. **Automatic retry**: Failed deletes are automatically retried when network is available
4. **Consistent with upload pattern**: Uses the same queue-based approach as uploads
5. **Better UX**: Users see immediate feedback even when operations are queued

## Testing Recommendations

### Test Case 1: Delete with Network Disabled
1. Disable network (airplane mode)
2. Delete a receipt/invoice/photo
3. **Expected**: Operation succeeds immediately, item added to `failedToDelete` queue
4. Enable network
5. Wait up to 1 hour or trigger queue manually
6. **Expected**: Delete API call succeeds, item removed from queue

### Test Case 2: Delete with Network Enabled
1. Ensure network is connected
2. Delete a receipt/invoice/photo
3. **Expected**: Delete API call happens immediately, item removed from local store

### Test Case 3: Delete Image in Upload Queue
1. Disable network
2. Add a receipt with photo (will be queued in `failedToUpload`)
3. Delete the receipt
4. **Expected**: 
   - Receipt and photo removed from local store
   - Photo removed from `failedToUpload` queue
   - No entry added to `failedToDelete` queue
   - No API call made

### Test Case 4: Bulk Delete with Mixed Items
1. Have some photos uploaded and some queued
2. Select both types and delete
3. **Expected**:
   - Queued photos removed from `failedToUpload`
   - Uploaded photos deleted via API or queued if offline
   - All removed from local store

### Test Case 5: Queue Processing
1. Queue several delete operations (delete while offline)
2. Enable network
3. Wait for next queue processing cycle
4. **Expected**: All queued deletes processed successfully

## Related Files

- `src/tbStores/UploadSyncStore.tsx` - Table schema and hooks
- `src/utils/images.tsx` - `useDeleteMediaCallback` hook
- `src/hooks/useUploadQueue.tsx` - Queue processing logic
- `src/components/SwipeableReceiptItem.tsx` - Receipt deletion
- `src/components/SwipeableInvoiceItem.tsx` - Invoice deletion
- `src/components/ProjectMediaList.tsx` - Bulk photo deletion

## Future Enhancements

1. **UI Indicators**: Show user when delete operations are queued vs executed
2. **Manual Retry**: Add button to manually trigger queue processing
3. **Progress Tracking**: Show progress during bulk delete operations
4. **Local File Cleanup**: Optionally delete local files for queued deletes
5. **Conflict Resolution**: Handle cases where server state changes before queued delete executes
