# NetInfo Integration Documentation

## Overview

This document describes the integration of `@react-native-community/netinfo` into ProjectHound to handle offline scenarios gracefully and optimize battery usage.

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

#### 2. Upload Queue Management

**Location**: `src/hooks/useUploadQueue.tsx`

Enhanced to check network connectivity before attempting uploads.

**Key Changes**:
- Imports and uses `useNetwork()` hook
- Checks `isConnected` and `isInternetReachable` before processing uploads
- Skips upload processing when offline with a console log message
- Automatically retries when connectivity is restored (via dependency array)

**Battery Optimization**:
- Prevents unnecessary network attempts when offline
- Reduces failed network calls that drain battery
- Prevents filling logs with timeout errors

#### 3. Image Upload Function

**Location**: `src/utils/images.tsx`

The `useAddImageCallback` hook now checks network status before attempting uploads.

**Key Changes**:
- Imports and uses `useNetwork()` hook
- Checks network status before calling `uploadImage()`
- Automatically queues uploads when offline without attempting network call
- Provides user-friendly messages about offline queueing

**User Experience**:
- When offline: "File saved. Will upload when internet connection is available."
- Upload is queued in `FailedToUploadData` store
- No network timeout delays for users
- Files are safely stored locally and will be uploaded when online

#### 4. UI Components

All screens with upload functionality have been updated to disable upload buttons when offline:

**Updated Screens**:
1. **`receipts.tsx`**: Receipt list with "Add Photo" button
2. **`photos/index.tsx`**: Photo/video capture screen
3. **`invoice/add.tsx`**: Invoice creation with photo capture
4. **`receipt/add.tsx`**: Receipt creation with photo capture
5. **`invoice/[invoiceId]/index.tsx`**: Invoice detail screen
6. **`receipt/[receiptId]/index.tsx`**: Receipt detail screen

**Button Behavior**:
- Buttons use ActionButton's 'disabled' type when offline
- Button text shows "(Offline)" suffix when no connection
- Buttons are visually greyed out in disabled state
- Button press is prevented when disabled (type='disabled')

**Example**:
```tsx
<ActionButton
  onPress={handleAddPhoto}
  type={!isConnected || isInternetReachable === false ? 'disabled' : 'action'}
  title={!isConnected || isInternetReachable === false ? 'Add Photo (Offline)' : 'Add Photo'}
/>
```

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

### 2. Upload Queue Processing

**Offline Behavior**:
1. User captures photo/video while offline
2. File is copied to local storage immediately
3. Network check detects offline status
4. Upload is queued in FailedToUploadData store WITHOUT attempting network call
5. User receives success message indicating queued upload

**Online Behavior**:
1. User captures photo/video while online
2. File is copied to local storage
3. Network check confirms online status
4. Upload proceeds normally to backend
5. If upload fails, file is added to retry queue

**Automatic Retry**:
1. `useUploadQueue` hook has `isConnected` and `isInternetReachable` in dependencies
2. When connectivity changes from offline to online, useEffect triggers
3. Failed uploads are automatically processed
4. Hourly interval also processes any remaining failed uploads

### 3. UI Feedback

**Visual Indicators**:
- Disabled buttons appear greyed out (iOS/Android specific colors)
- Text shows "(Offline)" suffix
- Button press is prevented

**Benefits**:
- Clear visual feedback to users about offline status
- Prevents user frustration from non-responsive buttons
- Communicates that feature will work when online

## Battery Optimization

### Problem Solved

Before NetInfo integration:
- Upload attempts made regardless of connectivity
- Network timeouts waste battery power
- Multiple retry attempts drain battery further
- Logs filled with timeout errors

After NetInfo integration:
- No network calls attempted when offline
- Upload queue processing skipped when offline
- Battery saved from failed connection attempts
- Cleaner logs with informative offline messages

### Impact

- **Reduced battery drain**: No wasted network attempts
- **Better user experience**: Faster offline interactions
- **Cleaner logs**: Fewer timeout errors
- **Automatic recovery**: Uploads resume when online

## Testing Recommendations

### Manual Testing

1. **Offline Upload Test**:
   - Enable airplane mode
   - Capture photo/receipt/invoice
   - Verify button shows "(Offline)"
   - Verify file is saved locally
   - Verify success message mentions queuing
   - Disable airplane mode
   - Verify upload completes automatically

2. **Connectivity Change Test**:
   - Start with WiFi enabled
   - Capture photo (should upload immediately)
   - Enable airplane mode mid-operation
   - Verify graceful handling
   - Disable airplane mode
   - Verify queued items upload

3. **Battery Impact Test**:
   - Monitor battery usage with NetInfo enabled
   - Compare to previous version if possible
   - Verify no excessive battery drain from network attempts

### Automated Testing

Consider adding tests for:
- NetworkContext state management
- Upload queue offline behavior
- Button disabled state based on connectivity
- Automatic retry on connectivity restoration

## Troubleshooting

### Issue: Network state not updating

**Solution**: Verify NetworkProvider is in the component tree above components using `useNetwork()`

### Issue: Uploads not retrying when online

**Solution**: Check that `isConnected` and `isInternetReachable` are in useEffect dependencies in `useUploadQueue`

### Issue: Buttons not disabling when offline

**Solution**: Verify component is using `useNetwork()` hook and checking connectivity in button type prop

## Future Enhancements

Potential improvements for the future:

1. **Network Type Awareness**:
   - Skip large video uploads on cellular
   - Only upload on WiFi based on user preference

2. **Upload Status Indicator**:
   - Show number of queued uploads in UI
   - Display upload progress when online

3. **Retry Strategy**:
   - Exponential backoff for failed uploads
   - Smarter retry scheduling based on network type

4. **Offline Mode Indicator**:
   - Global banner showing offline status
   - Toast notification when connectivity restored

## References

- [React Native NetInfo Documentation](https://github.com/react-native-netinfo/react-native-netinfo)
- [Expo NetInfo Guide](https://docs.expo.dev/versions/latest/sdk/netinfo/)
- ProjectHound Upload Sync: `docs/UPLOAD_SYNC_FIX.md`
