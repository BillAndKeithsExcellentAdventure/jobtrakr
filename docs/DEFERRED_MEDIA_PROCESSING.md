# Deferred Media Processing

## Overview

This document describes the implementation of deferred media processing in ProjectHound, which enables the app to queue media upload and delete operations when the device is offline and automatically process them when network connectivity is restored. This ensures a seamless user experience regardless of network conditions.

The implementation consists of two main components:
1. **Upload Sync System** - Handles failed uploads with timeout mechanisms and automatic retry
2. **Deferred Delete System** - Queues delete operations for later processing when offline

## Problem Statement

### Upload Challenges

When adding a receipt photo with cellular and WiFi disabled, the original implementation had several issues:
1. The upload operation took a very long time to fail (60+ seconds)
2. No entry was added to the `failedToUpload` table in `UploadSyncStore`
3. The image was not automatically retried once connectivity was restored

### Delete Challenges

When a user attempted to delete media (photos/videos) without network connectivity, the delete operation would fail immediately without any retry mechanism. Additionally, if an image was queued for upload (in the `failedToUpload` table) but never uploaded, deleting it would still attempt an API call to the server.

## Architecture

### Upload Sync Store

The `UploadSyncStore` provides two tables for managing deferred operations:

#### 1. `failedToUpload` Table

```typescript
failedToUpload: {
  id: { type: 'string' },
  organizationId: { type: 'string' },
  projectId: { type: 'string' },
  imageUri: { type: 'string' },
  imageType: { type: 'string' },
  resourceId: { type: 'string' },
  resourceType: { type: 'string' },
  errorDate: { type: 'number' },
}
```

#### 2. `failedToDelete` Table

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

### Upload Implementation

#### Timeout Mechanism

**File**: `src/utils/apiWithTokenRefresh.ts`

A `fetchWithTimeout` wrapper function was created that:
- Implements a 15-second timeout for all network requests
- Uses `AbortController` to cancel requests that exceed the timeout
- Provides clear error messages when timeout occurs
- Properly cleans up timeout handlers

```typescript
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = DEFAULT_TIMEOUT_MS, // 15000ms
): Promise<Response>
```

All fetch calls in both `fetchWithTokenRefresh` and `createApiWithRetry` now use `fetchWithTimeout` instead of native `fetch`.

**Benefits**:
- Fast failure when network is unavailable (15 seconds instead of 60+)
- Better user experience - app responds quickly
- Clear error messages for debugging

#### Error Handling

**File**: `src/utils/images.tsx`

A comprehensive try-catch block was added around the entire upload logic in `useAddImageCallback`:
- Wraps both `copyToLocalFolder` and `uploadImage` calls
- Catches any unexpected exceptions
- Ensures all failures result in a `failedToUpload` entry
- Builds the local URI path even if copying failed
- Returns success with a message indicating retry will happen later

```typescript
try {
  // Copy and upload logic
} catch (error) {
  // Add to failedToUpload queue even on unexpected errors
  const localUri = buildLocalMediaUri(orgId, projectId, id, mediaType, resourceType);
  addFailedToUploadRecord(data);
  return { status: 'Success', msg: 'Will retry later.' };
}
```

**Benefits**:
- All upload failures are tracked in the failedToUpload table
- Automatic retry mechanism works correctly
- No silent failures
- Better error logging for debugging

### Delete Implementation

#### `useDeleteMediaCallback` Hook

**File**: `src/utils/images.tsx`

This hook provides a network-aware delete callback that:

1. **Checks `failedToUpload` table first**: If any of the images being deleted are in the upload queue (never uploaded to server), it returns success without making an API call
2. **Handles offline scenarios**: If the device is offline, the delete request is queued in the `failedToDelete` table
3. **Handles API failures**: If the delete API call fails, the request is queued for retry
4. **Handles online scenarios**: If online, attempts immediate deletion via API

#### Queue Processing: `useUploadQueue` Hook

**File**: `src/hooks/useUploadQueue.tsx`

The upload queue processor was extended to also process delete operations:

- Imports `useAllFailedToDelete` and `deleteMedia`
- Processes both `failedToUpload` and `failedToDelete` queues
- Returns total count of both upload and delete items pending
- Runs every hour when network is available
- Processes uploads first, then deletes

#### Component Updates

Three components were updated to use the new delete hook:

**SwipeableReceiptItem**
- Uses `useDeleteMediaCallback` instead of direct `deleteMedia` call
- Checks if image is in `failedToUpload` queue
- If in upload queue, removes it from queue without API call
- Otherwise, uses the callback which handles network-aware deletion

**SwipeableInvoiceItem**
- Same pattern as SwipeableReceiptItem
- Handles invoice image deletion with network awareness

**ProjectMediaList**
- Bulk delete operation with network awareness
- Checks all selected images against `failedToUpload` queue
- Removes queued images from `failedToUpload` table
- Only calls API for images that were successfully uploaded

## Flow Diagrams

### Upload Flow - Normal (With Network)

```
User adds receipt photo
  ↓
Image is copied to local storage
  ↓
Image uploads to server within 15 seconds
  ↓
Success is returned to user
```

### Upload Flow - Offline (No Network)

```
User adds receipt photo
  ↓
Image is copied to local storage
  ↓
Upload attempt fails after 15 seconds (timeout)
  ↓
Error is caught by error handling in uploadImage
  ↓
Entry is added to failedToUpload table
  ↓
User sees success message: "File saved but unable upload to server. Will try later."
  ↓
useUploadQueue hook automatically retries every hour
  ↓
When network is restored, image is uploaded successfully
  ↓
Entry is removed from failedToUpload table
```

### Upload Flow - Unexpected Error

```
User adds receipt photo
  ↓
If any unexpected exception occurs (e.g., file system error, memory issue)
  ↓
Outer try-catch in useAddImageCallback catches it
  ↓
Entry is added to failedToUpload table
  ↓
User sees success message with error details
  ↓
Automatic retry will occur via useUploadQueue
```

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

### Upload Benefits

- Fast failure when network is unavailable (15 seconds instead of 60+)
- All upload failures are tracked and automatically retried
- Better user experience with clear feedback
- No silent failures

### Delete Benefits

- **Offline resilience**: Users can delete media even when offline
- **No unnecessary API calls**: Images that never uploaded don't trigger delete API calls
- **Automatic retry**: Failed deletes are automatically retried when network is available
- **Consistent with upload pattern**: Uses the same queue-based approach as uploads
- **Better UX**: Users see immediate feedback even when operations are queued

## Configuration

The upload timeout duration is configurable:

```typescript
const DEFAULT_TIMEOUT_MS = 15000; // 15 seconds
```

This can be adjusted in `src/utils/apiWithTokenRefresh.ts` if needed. Consider:
- **Shorter timeout (10s)**: Faster feedback, but may timeout on slow networks
- **Longer timeout (30s)**: More lenient for slow networks, but slower feedback when offline

15 seconds is a good balance for most use cases.

## Testing Recommendations

### Upload Tests

#### Test Case 1: Offline Upload
1. Enable Airplane Mode or disable both WiFi and Cellular
2. Open the app and navigate to a project
3. Add a new receipt with a photo
4. **Expected Results**:
   - Operation should complete in approximately 15-20 seconds (not 60+ seconds)
   - User should see a success message mentioning retry
   - Check app logs - should see timeout error message
   - Entry should be added to `failedToUpload` table (can verify in app state)

#### Test Case 2: Network Recovery for Uploads
1. Perform Test Case 1 first
2. Re-enable network connectivity (turn off Airplane Mode)
3. Wait up to 1 hour OR trigger upload queue manually
4. **Expected Results**:
   - Image should upload to server automatically
   - Entry should be removed from `failedToUpload` table
   - Image should appear on other devices after sync

#### Test Case 3: Slow Network
1. Use network throttling (can use developer tools or network simulator)
2. Set network to slow 3G or similar
3. Add a receipt with a photo
4. **Expected Results**:
   - If upload completes within 15 seconds: normal success
   - If upload exceeds 15 seconds: timeout, added to failedToUpload
   - No hanging or frozen UI

### Delete Tests

#### Test Case 4: Delete with Network Disabled
1. Disable network (airplane mode)
2. Delete a receipt/invoice/photo
3. **Expected**: Operation succeeds immediately, item added to `failedToDelete` queue
4. Enable network
5. Wait up to 1 hour or trigger queue manually
6. **Expected**: Delete API call succeeds, item removed from queue

#### Test Case 5: Delete with Network Enabled
1. Ensure network is connected
2. Delete a receipt/invoice/photo
3. **Expected**: Delete API call happens immediately, item removed from local store

#### Test Case 6: Delete Image in Upload Queue
1. Disable network
2. Add a receipt with photo (will be queued in `failedToUpload`)
3. Delete the receipt
4. **Expected**: 
   - Receipt and photo removed from local store
   - Photo removed from `failedToUpload` queue
   - No entry added to `failedToDelete` queue
   - No API call made

#### Test Case 7: Bulk Delete with Mixed Items
1. Have some photos uploaded and some queued
2. Select both types and delete
3. **Expected**:
   - Queued photos removed from `failedToUpload`
   - Uploaded photos deleted via API or queued if offline
   - All removed from local store

#### Test Case 8: Queue Processing
1. Queue several upload and delete operations (add and delete items while offline)
2. Enable network
3. Wait for next queue processing cycle
4. **Expected**: All queued uploads and deletes processed successfully

### Verification Points

To verify the implementation is working:
1. Check console logs for timeout messages
2. Verify `failedToUpload` table contains entries after offline upload attempts
3. Verify `failedToDelete` table contains entries after offline delete attempts
4. Verify entries are removed after successful retry
5. Confirm operations complete quickly (within 15-20 seconds) when offline
6. Verify no silent failures - all failures should be logged

## Related Files

### Core Implementation
- `src/tbStores/UploadSyncStore.tsx` - Table schemas and hooks for both tables
- `src/utils/apiWithTokenRefresh.ts` - Timeout implementation
- `src/utils/images.tsx` - `useAddImageCallback` and `useDeleteMediaCallback` hooks
- `src/hooks/useUploadQueue.tsx` - Queue processing logic for both uploads and deletes

### Component Integration
- `src/components/SwipeableReceiptItem.tsx` - Receipt deletion
- `src/components/SwipeableInvoiceItem.tsx` - Invoice deletion
- `src/components/ProjectMediaList.tsx` - Bulk photo deletion

## Future Enhancements

The following improvements are prioritized based on user impact and implementation complexity:

### High Priority

1. **User notification when operations are queued** - Users should receive clear feedback when files are queued vs uploaded/deleted immediately. This improves transparency and reduces confusion about operation status.

2. **Upload/delete progress indicator** - Show visual feedback during active operations so users know the operation is in progress and can estimate completion time.

3. **UI Indicators for queued operations** - Show users when upload/delete operations are queued vs executed immediately with visual badges or status indicators.

### Medium Priority

4. **Exponential backoff for retry attempts** - Implement smarter retry logic that increases delay between attempts (e.g., 1min, 5min, 15min, 1hr) to reduce server load and battery consumption while still ensuring operations eventually succeed.

5. **Manual retry button in UI** - Allow users to manually trigger queue processing for failed items instead of waiting for the hourly automatic retry.

6. **Progress Tracking for bulk operations** - Show progress during bulk delete operations with count of completed/remaining items.

### Low Priority

7. **Configurable timeout per operation type** - Different media types (photos vs videos) may need different timeout thresholds. Currently all uploads use 15s timeout.

8. **Local File Cleanup for queued deletes** - Optionally delete local files for queued deletes to free up storage space immediately.

9. **Conflict Resolution** - Handle cases where server state changes before queued delete executes (e.g., file already deleted by another device).

### Completed

- ✅ **Network state detection using `@react-native-community/netinfo`** - Implemented via `NetworkContext`. See `docs/NETINFO_INTEGRATION.md` for details.
- ✅ **Timeout mechanism for uploads** - 15-second timeout implemented
- ✅ **Deferred delete queue** - Full implementation with automatic retry
- ✅ **Smart delete handling** - No API calls for images that never uploaded
