# Upload Sync Fix Documentation

## Problem Statement

When adding a receipt photo with cellular and WiFi disabled:
1. The upload operation took a very long time to fail (60+ seconds)
2. No entry was added to the `failedToUpload` table in `UploadSyncStore`
3. The image was not automatically retried once connectivity was restored

## Root Cause Analysis

### Issue 1: Slow Failure (Long Timeout)
The `uploadImage` function in `src/utils/images.tsx` used the native `fetch` API without any timeout mechanism. When network connectivity is unavailable, `fetch` waits for the default system timeout, which can be 60 seconds or longer. This creates a poor user experience as the app appears to hang.

### Issue 2: Missing FailedToUpload Entries
The `useAddImageCallback` function in `src/utils/images.tsx` did not have a top-level try-catch block. While `uploadImage` has internal error handling, if any unexpected exception occurred outside of that function (e.g., in `copyToLocalFolder` or in other parts of the upload flow), it would bypass the failedToUpload record creation logic.

## Solution Implementation

### 1. Added Timeout to Fetch Operations

**File**: `src/utils/apiWithTokenRefresh.ts`

Created a new `fetchWithTimeout` wrapper function that:
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

### 2. Improved Error Handling

**File**: `src/utils/images.tsx`

Added a comprehensive try-catch block around the entire upload logic in `useAddImageCallback`:
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

## How the Fix Works

### Normal Flow (With Network)
1. User adds receipt photo
2. Image is copied to local storage
3. Image uploads to server within 15 seconds
4. Success is returned to user

### Offline Flow (No Network)
1. User adds receipt photo
2. Image is copied to local storage
3. Upload attempt fails after 15 seconds (timeout)
4. Error is caught by error handling in `uploadImage`
5. Entry is added to `failedToUpload` table
6. User sees success message: "File saved but unable upload to server. Will try later."
7. `useUploadQueue` hook automatically retries every hour
8. When network is restored, image is uploaded successfully
9. Entry is removed from `failedToUpload` table

### Exception Flow (Unexpected Error)
1. User adds receipt photo
2. If any unexpected exception occurs (e.g., file system error, memory issue)
3. Outer try-catch in `useAddImageCallback` catches it
4. Entry is added to `failedToUpload` table
5. User sees success message with error details
6. Automatic retry will occur via `useUploadQueue`

## Testing Instructions

Since there is no automated test infrastructure, manual testing is required:

### Test Case 1: Offline Upload
1. Enable Airplane Mode or disable both WiFi and Cellular
2. Open the app and navigate to a project
3. Add a new receipt with a photo
4. **Expected Results**:
   - Operation should complete in approximately 15-20 seconds (not 60+ seconds)
   - User should see a success message mentioning retry
   - Check app logs - should see timeout error message
   - Entry should be added to `failedToUpload` table (can verify in app state)

### Test Case 2: Network Recovery
1. Perform Test Case 1 first
2. Re-enable network connectivity (turn off Airplane Mode)
3. Wait up to 1 hour OR trigger upload queue manually
4. **Expected Results**:
   - Image should upload to server automatically
   - Entry should be removed from `failedToUpload` table
   - Image should appear on other devices after sync

### Test Case 3: Slow Network
1. Use network throttling (can use developer tools or network simulator)
2. Set network to slow 3G or similar
3. Add a receipt with a photo
4. **Expected Results**:
   - If upload completes within 15 seconds: normal success
   - If upload exceeds 15 seconds: timeout, added to failedToUpload
   - No hanging or frozen UI

### Verification Points

To verify the fix is working:
1. Check console logs for timeout messages
2. Verify `failedToUpload` table contains entries after offline attempts
3. Verify entries are removed after successful retry
4. Confirm upload completes quickly (within 15-20 seconds) when offline
5. Verify no silent failures - all failures should be logged

## Configuration

The timeout duration is configurable:

```typescript
const DEFAULT_TIMEOUT_MS = 15000; // 15 seconds
```

This can be adjusted in `src/utils/apiWithTokenRefresh.ts` if needed. Consider:
- **Shorter timeout (10s)**: Faster feedback, but may timeout on slow networks
- **Longer timeout (30s)**: More lenient for slow networks, but slower feedback when offline

15 seconds is a good balance for most use cases.

## Related Files

- `src/utils/apiWithTokenRefresh.ts` - Timeout implementation
- `src/utils/images.tsx` - Error handling improvements
- `src/tbStores/UploadSyncStore.tsx` - Failed upload tracking
- `src/hooks/useUploadQueue.tsx` - Automatic retry mechanism

## Future Improvements

The following improvements are prioritized based on user impact and implementation complexity:

### High Priority

1. **User notification when uploads are queued** - Users should receive clear feedback when files are queued vs uploaded immediately. This improves transparency and reduces confusion about upload status.

2. **Upload progress indicator** - Show visual feedback during active uploads so users know the operation is in progress and can estimate completion time.

### Medium Priority

3. **Exponential backoff for retry attempts** - Implement smarter retry logic that increases delay between attempts (e.g., 1min, 5min, 15min, 1hr) to reduce server load and battery consumption while still ensuring uploads eventually succeed.

4. **Manual retry button in UI** - Allow users to manually trigger upload retry for failed items instead of waiting for the hourly automatic retry.

### Low Priority

5. **Configurable timeout per operation type** - Different media types (photos vs videos) may need different timeout thresholds. Currently all uploads use 15s timeout.

### Completed

- ✅ **Network state detection using `@react-native-community/netinfo`** - Implemented via `NetworkContext`. See `docs/NETINFO_INTEGRATION.md` for details.
