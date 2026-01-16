# Deferred Media Processing

## Overview

This document describes the implementation of deferred media processing in ProjectHound, which enables the app to queue **all** media uploads for background processing and queue delete operations when the device is offline. This ensures a seamless user experience with instant responsiveness regardless of network conditions.

The implementation consists of two main components:
1. **Upload Queue System** - Queues all media uploads for background processing to avoid making users wait
2. **Deferred Delete System** - Queues delete operations for later processing when offline

## Problem Statement

### Upload Challenges

The original implementation had several issues:
1. **Users had to wait** - When online, users waited for uploads to complete, which could be slow on poor networks (15-60+ seconds)
2. **Inconsistent UX** - Different behavior when online (immediate upload with wait) vs offline (queued)
3. **Complex code** - Network status checking created branching logic that was harder to maintain

### Delete Challenges

When a user attempted to delete media (photos/videos) without network connectivity, the delete operation would fail immediately without any retry mechanism. Additionally, if an image was queued for upload (in the `mediaToUpload` table) but never uploaded, deleting it would still attempt an API call to the server.

## Architecture

### Upload Sync Store

The `UploadSyncStore` (now `MediaUploadSyncStore`) provides two tables for managing deferred operations:

#### 1. `mediaToUpload` Table

This table queues **all** media uploads for background processing (not just failed ones).

```typescript
mediaToUpload: {
  id: { type: 'string' },
  mediaType: { type: 'string' },
  resourceType: { type: 'string' },
  organizationId: { type: 'string' },
  projectId: { type: 'string' },
  itemId: { type: 'string' },
  localUri: { type: 'string' },
  uploadDate: { type: 'number' },
}
```

#### 2. `serverMediaToDelete` Table

This table queues **all** media delete operations for background processing (not just failed ones).

```typescript
serverMediaToDelete: {
  id: { type: 'string' },
  organizationId: { type: 'string' },
  projectId: { type: 'string' },
  imageIds: { type: 'string' },
  imageType: { type: 'string' },
  deleteDate: { type: 'number' },
}
```

### Upload Implementation

#### Background Queue Strategy

**File**: `src/utils/images.tsx`

The `useAddImageCallback` hook now **always** queues uploads for background processing:
- Removes network status checking - no more online/offline branching
- All images are added to `mediaToUpload` queue immediately after local copy
- Returns instantly to user with success message
- Upload queue processor handles actual uploads in background

```typescript
// Always queue the upload for background processing
const data: MediaToUploadData = {
  id: id,
  resourceType: resourceType,
  mediaType: mediaType,
  localUri: copyLocalResult.uri!,
  organizationId: orgId,
  projectId: projectId,
  itemId: id,
  uploadDate: Date.now(),
};
const result = addMediaToUploadRecord(data);
return {
  status: 'Success',
  id: id,
  uri: copyLocalResult.uri!,
  msg: 'File saved. Upload will be processed in the background.',
};
```

**Benefits**:
- **Instant UI response** - Users never wait for uploads
- **Consistent UX** - Same fast experience online or offline
- **Simpler code** - Removed ~50 lines of conditional branching logic
- **Better error handling** - All uploads go through same retry mechanism

#### Error Handling

A comprehensive try-catch block wraps the entire upload logic in `useAddImageCallback`:
- Catches any unexpected exceptions during file copy
- Ensures all errors still result in a `mediaToUpload` queue entry
- Builds the local URI path even if copying failed
- Returns success with error message indicating retry will happen later

```typescript
try {
  // Copy file locally
  const copyLocalResult = await copyToLocalFolder(...);
  // Queue for background upload
  addMediaToUploadRecord(data);
} catch (error) {
  // Even on exception, queue for background upload
  const localUri = buildLocalMediaUri(orgId, projectId, id, mediaType, resourceType);
  addMediaToUploadRecord(data);
  return { status: 'Success', msg: 'File saved. Will retry later.' };
}
```

**Benefits**:
- No silent failures - all uploads tracked in mediaToUpload table
- Automatic retry for all failure scenarios
- Better error logging for debugging

### Delete Implementation

#### `useDeleteMediaCallback` Hook

**File**: `src/utils/images.tsx`

This hook provides a callback that **always queues** delete operations for background processing:

1. **Checks `mediaToUpload` table first**: If any of the images being deleted are in the upload queue (never uploaded to server), it returns success without making an API call
2. **Always queues for background**: All delete operations are queued in the `serverMediaToDelete` table for background processing
3. **No network checking**: Removes network status branching - consistent behavior online or offline

#### Queue Processing: `useUploadQueue` Hook

**File**: `src/hooks/useUploadQueue.tsx`

The upload queue processor handles background processing of uploads and deletes:

- Imports `useAllMediaToUpload` and `useAllServerMediaToDelete`
- Processes both `mediaToUpload` and `serverMediaToDelete` queues
- Returns total count of both upload and delete items pending
- Runs automatically every hour when network is available
- Processes uploads first, then deletes
- Uses extended timeout (120 seconds) for queue processing

#### Component Updates

Three components were updated to use the new delete hook:

**SwipeableReceiptItem**
- Uses `useDeleteMediaCallback` instead of direct `deleteMedia` call
- Checks if image is in `mediaToUpload` queue
- If in upload queue, removes it from queue without API call
- Otherwise, uses the callback which handles network-aware deletion

**SwipeableInvoiceItem**
- Same pattern as SwipeableReceiptItem
- Handles invoice image deletion with network awareness

**ProjectMediaList**
- Bulk delete operation with network awareness
- Checks all selected images against `mediaToUpload` queue
- Removes queued images from `mediaToUpload` table
- Only calls API for images that were successfully uploaded

## Flow Diagrams

### Upload Flow - All Scenarios (Online or Offline)

```
User adds receipt photo
  ↓
Image is copied to local storage
  ↓
Entry is added to mediaToUpload table immediately
  ↓
User sees instant success: "File saved. Upload will be processed in the background."
  ↓
useUploadQueue hook processes queue every hour
  ↓
If network available: Upload to server
  ↓
On successful upload: Remove from mediaToUpload table
  ↓
On failed upload: Keep in queue for next retry
```

### Upload Flow - Exception Handling

```
User adds receipt photo
  ↓
If any unexpected exception occurs (e.g., file system error, memory issue)
  ↓
Outer try-catch in useAddImageCallback catches it
  ↓
Entry is still added to mediaToUpload table
  ↓
User sees success message with error details
  ↓
Automatic retry will occur via useUploadQueue
```

### Delete Flow - All Scenarios (Online or Offline)

```
User deletes media
  ↓
useDeleteMediaCallback checks mediaToUpload
  ↓
Images NOT in upload queue
  ↓
Entry is added to serverMediaToDelete table immediately
  ↓
User sees instant success: "Delete operation queued. Will be processed in the background."
  ↓
useUploadQueue hook processes queue every hour
  ↓
If network available: Delete from server via API
  ↓
On successful delete: Remove from serverMediaToDelete table
  ↓
On failed delete: Keep in queue for next retry
```

### Delete Flow - Image in Upload Queue

```
User deletes media
  ↓
useDeleteMediaCallback checks mediaToUpload
  ↓
Images ARE in upload queue
  ↓
Remove from mediaToUpload queue
  ↓
Remove from local store
  ↓
Return success (no API call needed)
```

### Queue Processing

```
Every hour (automatically)
  ↓
Check network status
  ↓
If online:
  ↓
  Process all mediaToUpload items
  ↓
  Process all serverMediaToDelete items
  ↓
  Remove successful operations from queues
If offline:
  ↓
  Skip processing, retry next hour
```

## Benefits

### Upload Benefits

- **Instant response** - Users never wait for uploads (immediate return)
- **Consistent UX** - Same fast experience whether online or offline
- **Simpler code** - Removed ~50 lines of network status branching logic
- **All uploads tracked** - Every upload goes through queue with automatic retry
- **Better error handling** - Centralized retry mechanism for all uploads
- **No silent failures** - All uploads logged and tracked

### Delete Benefits

- **Instant response** - Users never wait for deletes (immediate return)
- **Consistent UX** - Same fast experience whether online or offline
- **Simpler code** - Removed network status branching logic
- **No unnecessary API calls**: Images that never uploaded don't trigger delete API calls
- **Automatic retry**: All deletes are automatically retried when network is available
- **Consistent with upload pattern**: Uses the same queue-based approach as uploads
- **Better UX**: Users see immediate feedback - all operations are queued

## Configuration

### Queue Processing Interval

The upload queue processes automatically every hour:

```typescript
// In useUploadQueue.tsx
setInterval(() => {
  void processQueue();
}, 3600000); // 1 hour = 3600000ms
```

### Upload Timeout for Queue Processing

When the queue processor uploads files, it uses an extended timeout:

```typescript
const result = await uploadImage(
  details,
  auth.getToken,
  item.mediaType,
  item.resourceType,
  item.localUri,
  120000, // 120 seconds for background processing
);
```

This longer timeout (120s vs normal 15s) ensures background uploads have time to complete on slow networks.

## Testing Recommendations

### Upload Tests

#### Test Case 1: Add Image (Any Network State)
1. Open the app and navigate to a project
2. Add a new receipt with a photo
3. **Expected Results**:
   - Operation completes instantly (< 1 second)
   - User sees: "File saved. Upload will be processed in the background."
   - Image appears in UI immediately
   - Entry added to `mediaToUpload` table (can verify in app state)
   - Works the same whether online or offline

#### Test Case 2: Background Upload Processing (Online)
1. Add several images per Test Case 1
2. Ensure network is connected
3. Wait up to 1 hour OR trigger upload queue manually
4. **Expected Results**:
   - Images upload to server in background
   - Entries removed from `mediaToUpload` table after successful upload
   - Images appear on other devices after sync

#### Test Case 3: Background Upload Processing (Offline Then Online)
1. Disable network (airplane mode)
2. Add several images per Test Case 1
3. Verify entries in `mediaToUpload` table
4. Re-enable network connectivity
5. Wait up to 1 hour OR trigger upload queue manually
6. **Expected Results**:
   - Images upload to server when network restored
   - Entries removed from `mediaToUpload` table
   - Images appear on other devices after sync

### Delete Tests

#### Test Case 4: Delete Media (Any Network State)
1. Delete a receipt/invoice/photo
2. **Expected Results**:
   - Operation completes instantly (< 1 second)
   - User sees: "Delete operation queued. Will be processed in the background."
   - Local file removed immediately
   - Entry added to `serverMediaToDelete` table
   - Works the same whether online or offline

#### Test Case 5: Background Delete Processing (Online)
1. Delete several items per Test Case 4
2. Ensure network is connected
3. Wait up to 1 hour OR trigger queue manually
4. **Expected**: Deletes processed on server, entries removed from `serverMediaToDelete` table

#### Test Case 6: Delete Image in Upload Queue
1. Add a receipt with photo (will be queued in `mediaToUpload`)
2. Delete the receipt before queue processes
3. **Expected**: 
   - Receipt and photo removed from local store
   - Photo removed from `mediaToUpload` queue
   - No entry added to `serverMediaToDelete` queue
   - No API call made

#### Test Case 7: Bulk Delete with Mixed Items
1. Have some photos already uploaded and some still in queue
2. Select both types and delete
3. **Expected**:
   - Queued photos removed from `mediaToUpload`
   - Uploaded photos deleted via API or queued if offline
   - All removed from local store

#### Test Case 8: Queue Processing
1. Queue several upload and delete operations (add and delete items while offline)
2. Enable network
3. Wait for next queue processing cycle
4. **Expected**: All queued uploads and deletes processed successfully

### Verification Points

To verify the implementation is working:
1. Check console logs for queue processing messages
2. Verify `mediaToUpload` table contains entries immediately after adding images
3. Verify `serverMediaToDelete` table contains entries immediately after deleting items
4. Verify entries are removed after successful background processing
5. Confirm add image operations complete instantly (< 1 second)
6. Confirm delete operations complete instantly (< 1 second)
7. Verify no silent failures - all uploads and deletes logged and tracked in queues

## Related Files

### Core Implementation
- `src/tbStores/UploadSyncStore.tsx` - Table schemas and hooks (`MediaUploadSyncStore`, `mediaToUpload`, `serverMediaToDelete`)
- `src/utils/images.tsx` - `useAddImageCallback` (always queues) and `useDeleteMediaCallback` (always queues) hooks
- `src/hooks/useUploadQueue.tsx` - Background queue processing logic for both uploads and deletes

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
- ✅ **Always queue uploads** - All uploads queued for background processing regardless of network status
- ✅ **Always queue deletes** - All deletes queued for background processing regardless of network status
- ✅ **Instant UI response** - Users never wait for uploads or deletes
- ✅ **Deferred delete queue** - Full implementation with automatic retry
- ✅ **Smart delete handling** - No API calls for images that never uploaded
- ✅ **Renamed terminology** - `failedToUpload` → `mediaToUpload` and `failedToDelete` → `serverMediaToDelete` to better reflect that all operations are queued
