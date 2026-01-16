# NetInfo Integration Documentation

## Overview

This document describes the integration of `@react-native-community/netinfo` into ProjectHound to manage network state and optimize background queue processing.

## Implementation Details

### Package Installed

- **@react-native-community/netinfo v11.4.1**

### Architecture

#### 1. NetworkContext Provider

**Location**: `src/context/NetworkContext.tsx`

A React Context that provides global network state management throughout the application.

**Exports**:
- `NetworkProvider`: Context provider component
- `useNetwork()`: Hook to access network state

**State Provided**:
```typescript
interface NetworkContextType {
  isConnected: boolean;           // Whether device has any network connection
  isInternetReachable: boolean | null;  // Whether internet is actually reachable
  networkType: string | null;     // Type of network (wifi, cellular, etc.)
}
```

**Features**:
- Automatically subscribes to network state changes using NetInfo.addEventListener
- Fetches initial network state on mount
- Logs all network state changes for debugging
- Cleans up subscriptions on unmount

#### 2. Background Queue Processing

**Location**: `src/hooks/useUploadQueue.tsx`

The upload queue processor uses network connectivity to optimize battery usage.

**Key Changes**:
- Imports and uses `useNetwork()` hook
- Checks `isConnected` and `isInternetReachable` before processing queues
- Skips queue processing when offline with a console log message
- Automatically retries when connectivity is restored (via dependency array)

**Battery Optimization**:
- Prevents unnecessary network attempts when offline
- Reduces failed network calls that drain battery
- Prevents filling logs with timeout errors

#### 3. Media Upload Operations

**Location**: `src/utils/images.tsx`

The `useAddImageCallback` hook **always queues** uploads for background processing regardless of network status.

**Key Changes**:
- **No longer checks network status** - uploads are always queued
- All images added to `mediaToUpload` table immediately after local copy
- Users get instant response: "File saved. Upload will be processed in the background."
- Background queue processor handles actual uploads when network is available

**User Experience**:
- **Instant response** - no waiting for uploads (< 1 second)
- **Consistent behavior** - same fast experience online or offline
- Files are safely stored locally and uploaded by background queue
- User message: "File saved. Upload will be processed in the background."

#### 4. Media Delete Operations

**Location**: `src/utils/images.tsx`

The `useDeleteMediaCallback` hook **always queues** deletes for background processing regardless of network status.

**Key Changes**:
- **No longer checks network status** - deletes are always queued
- All deletes added to `serverMediaToDelete` table immediately
- Users get instant response: "Delete operation queued. Will be processed in the background."
- Background queue processor handles actual API deletes when network is available

**User Experience**:
- **Instant response** - no waiting for deletes (< 1 second)
- **Consistent behavior** - same fast experience online or offline
- Local files removed immediately, server deletes handled by background queue

### Provider Setup

**Location**: `src/app/_layout.tsx`

NetworkProvider is integrated into the provider hierarchy:

```tsx
<AuthTokenProvider>
  <NetworkProvider>
    <KeyboardProvider>
      {/* ... rest of app */}
    </KeyboardProvider>
  </NetworkProvider>
</AuthTokenProvider>
```

**Position**: Placed after AuthTokenProvider but before UI components to ensure network state is available throughout the app.

## How It Works

### 1. Network State Monitoring

- NetInfo listens for network connectivity changes
- NetworkContext broadcasts state to all components via React Context
- State updates trigger re-renders in components using `useNetwork()`

### 2. Background Queue Processing

**All Operations (Online or Offline)**:
1. User captures photo/video or deletes media
2. File operation completes locally immediately (< 1 second)
3. Operation is queued in background queue (`mediaToUpload` or `serverMediaToDelete`)
4. User receives instant success message
5. Background queue processor runs every hour when online
6. Network operations (upload/delete API calls) happen in background

**Upload Flow**:
1. User captures photo/video
2. File is copied to local storage immediately
3. Entry added to `mediaToUpload` table (no network check)
4. User sees: "File saved. Upload will be processed in the background."
5. Background queue uploads to server when network available

**Delete Flow**:
1. User deletes media
2. Local file removed immediately
3. Entry added to `serverMediaToDelete` table (no network check)
4. User sees: "Delete operation queued. Will be processed in the background."
5. Background queue deletes from server when network available

**Automatic Queue Processing**:
1. `useUploadQueue` hook runs every hour
2. Checks network status before attempting operations
3. If online: Processes `mediaToUpload` and `serverMediaToDelete` queues
4. If offline: Skips processing, logs message, retries next hour or when connectivity restored
5. On connectivity change: useEffect triggers queue processing

## Battery Optimization

### Problem Solved

Before optimizations:
- Network attempts made regardless of connectivity status
- Network timeouts wasted battery power
- Multiple retry attempts drained battery further
- Logs filled with timeout errors

After optimizations:
- **Upload/Delete operations**: Always queued, no immediate network attempts
- **Queue processing**: Skipped when offline (checked by useUploadQueue)
- **Battery saved**: No wasted network connection attempts
- **Cleaner logs**: Informative messages instead of timeout errors

### Impact

- **Reduced battery drain**: Queue processing skipped when offline
- **Better user experience**: Instant response for all operations (< 1 second)
- **Cleaner logs**: Fewer timeout errors, more informative messages
- **Automatic recovery**: Queued operations process when network restored
- **Simplified code**: ~104 lines of branching logic removed

## Testing Recommendations

### Manual Testing

1. **Upload Test (Any Network State)**:
   - Capture photo/receipt/invoice (online or offline)
   - Verify operation completes instantly (< 1 second)
   - Verify success message: "File saved. Upload will be processed in the background."
   - Verify file appears in UI immediately
   - Check `mediaToUpload` queue has entry
   - Wait for background processing (up to 1 hour) or trigger manually
   - Verify upload completes and entry removed from queue

2. **Delete Test (Any Network State)**:
   - Delete media (online or offline)
   - Verify operation completes instantly (< 1 second)
   - Verify success message: "Delete operation queued. Will be processed in the background."
   - Verify file removed from UI immediately
   - Check `serverMediaToDelete` queue has entry
   - Wait for background processing or trigger manually
   - Verify server delete completes and entry removed from queue

3. **Offline Queue Processing Test**:
   - Enable airplane mode
   - Capture several photos and delete several items
   - Verify all operations complete instantly
   - Verify entries in `mediaToUpload` and `serverMediaToDelete` queues
   - Disable airplane mode
   - Verify background queue processes all operations
   - Verify queues are cleared after successful processing

4. **Battery Impact Test**:
   - Monitor battery usage with current implementation
   - Verify no excessive battery drain from network attempts when offline
   - Verify queue processing only runs when online

### Automated Testing

Consider adding tests for:
- NetworkContext state management
- Background queue skips processing when offline
- Background queue processes when online
- Upload/delete operations always queue immediately
- Automatic retry on connectivity restoration
- Queue entry creation for uploads and deletes

## Troubleshooting

### Issue: Network state not updating

**Solution**: Verify NetworkProvider is in the component tree above components using `useNetwork()`

### Issue: Queue not processing when online

**Solution**: Check that `isConnected` and `isInternetReachable` are in useEffect dependencies in `useUploadQueue`

### Issue: Operations not queuing

**Solution**: Verify `useAddImageCallback` and `useDeleteMediaCallback` are properly calling queue hooks

### Issue: Uploads/deletes happening immediately instead of queuing

**Solution**: Ensure you're using the latest version of these hooks - they should always queue, not attempt immediate operations

## Future Enhancements

The following improvements are prioritized based on user impact and implementation complexity:

### High Priority

1. **Queue Status Indicator**:
   - Show number of queued uploads/deletes in the UI (e.g., badge on settings/upload screen)
   - Display processing progress when online
   - **Impact**: High - Users need visibility into pending operations
   - **Complexity**: Medium - Requires UI changes and integration with UploadSyncStore

2. **Global Network Status Indicator**:
   - Global banner or status indicator showing offline status across all screens
   - Toast notification when connectivity is restored and queue processing begins
   - **Impact**: High - Improves user awareness of network status and queue processing
   - **Complexity**: Low - Can use existing NetworkContext state
   - **Note**: Debug offline mode exists (see `docs/DEBUG_OFFLINE_MODE.md`) but production users need similar feedback

### Medium Priority

3. **Retry Strategy with Exponential Backoff**:
   - Implement exponential backoff for retries (e.g., 1min, 5min, 15min, 1hr)
   - Smarter retry scheduling based on network type
   - **Impact**: Medium - Reduces server load and battery drain
   - **Complexity**: Medium - Requires changes to `useUploadQueue` retry logic

4. **Manual Queue Processing Trigger**:
   - Allow users to manually trigger queue processing instead of waiting for hourly interval
   - **Impact**: Medium - Better user control
   - **Complexity**: Low - Add button that calls queue processing function

### Low Priority

5. **Network Type Awareness**:
   - Skip large video uploads on cellular data
   - User preference for WiFi-only uploads
   - **Impact**: Low-Medium - Helpful for users with limited data plans
   - **Complexity**: Medium - Requires UI for preferences and logic to check file sizes
   - **Note**: `networkType` is already available from NetworkContext but not currently used

### Completed

- ✅ **Always queue uploads** - All uploads queued for background processing regardless of network status
- ✅ **Always queue deletes** - All deletes queued for background processing regardless of network status
- ✅ **Instant UI response** - Users never wait for uploads or deletes (< 1 second)
- ✅ **Automatic retry when connectivity restored** - Queue automatically processes when online
- ✅ **Battery optimization** - Queue processing skipped when offline
- ✅ **Renamed terminology** - `failedToUpload` → `mediaToUpload`, `failedToDelete` → `serverMediaToDelete`

## References

- [React Native NetInfo Documentation](https://github.com/react-native-netinfo/react-native-netinfo)
- [Expo NetInfo Guide](https://docs.expo.dev/versions/latest/sdk/netinfo/)
- ProjectHound Deferred Media Processing: `docs/DEFERRED_MEDIA_PROCESSING.md`
