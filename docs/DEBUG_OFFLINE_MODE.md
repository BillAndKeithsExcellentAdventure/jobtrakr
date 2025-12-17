# Debug Offline Mode Simulation

## Overview

This feature allows developers to simulate offline mode when running a development build of ProjectHound. This is useful for testing offline functionality without needing to physically disconnect from the network or enable airplane mode.

## How It Works

### Configuration

The offline mode simulation is controlled by a boolean flag `debugForceOffline` stored in the AppSettings store. This setting:

- Is only available in development builds (when `__DEV__` is `true`)
- Is persisted across app sessions
- Defaults to `false`
- Can be toggled via a Switch control in the App Settings screen

### Implementation Details

#### 1. AppSettings Store

**Location**: `src/tbStores/appSettingsStore/`

Added `debugForceOffline` field to the settings table schema:

```typescript
debugForceOffline: { type: 'boolean', default: false }
```

The field is included in the `SettingsData` interface and the `INITIAL_SETTINGS` object.

#### 2. NetworkProvider

**Location**: `src/context/NetworkContext.tsx`

The NetworkProvider was updated to check the `debugForceOffline` setting:

- Retrieves the app settings using `useAppSettings()` hook
- Checks if the app is running in development mode using `__DEV__`
- When `debugForceOffline` is `true` and the app is in development mode:
  - `isConnected` returns `false` instead of the actual network state
  - `isInternetReachable` returns `false` instead of the actual state
  - A console log message is displayed: "🔴 Debug offline mode is ENABLED - Network connectivity is being simulated as offline"

**Important**: The actual network state from NetInfo is still monitored and updated, but the values provided to consumers of the NetworkContext are overridden when debug offline mode is enabled.

#### 3. SetAppSettings Screen

**Location**: `src/app/(protected)/(home)/appSettings/SetAppSettings.tsx`

A new Switch control was added to toggle the debug offline mode:

- Only visible when running in a development build (`__DEV__` is `true`)
- Positioned after the email field and before the company logo selector
- Uses the large size switch for better visibility
- Labeled as "Debug: Force Offline Mode"
- Immediately saves the setting to the store when toggled

## Usage

### Enabling Debug Offline Mode

1. Run the app in development mode: `npm run dev`
2. Navigate to App Settings (Settings → Define Company Settings)
3. Scroll down to see the "Debug: Force Offline Mode" switch (only visible in dev builds)
4. Toggle the switch to enable offline mode simulation
5. The app will immediately simulate being offline

### Testing Offline Features

When debug offline mode is enabled:

- Upload buttons will show "(Offline)" suffix and appear disabled
- Images/files will be queued for upload instead of uploaded immediately
- Network-dependent features should behave as if the device has no connectivity
- The console will show: "🔴 Debug offline mode is ENABLED - Network connectivity is being simulated as offline"

### Disabling Debug Offline Mode

Simply toggle the switch back to off in the App Settings screen.

## Benefits

1. **No Physical Network Changes**: Test offline functionality without disconnecting WiFi or enabling airplane mode
2. **Quick Testing**: Toggle offline mode on/off instantly without leaving the app
3. **Consistent Testing**: Ensures consistent offline behavior across test scenarios
4. **Battery Friendly**: Real network connection remains active, so other development tools continue to work
5. **Dev-Only Feature**: Automatically hidden in production builds, preventing user confusion

## Technical Notes

- The feature only affects the `isConnected` and `isInternetReachable` values returned by the `useNetwork()` hook
- The actual network state from `@react-native-community/netinfo` continues to be monitored
- The `networkType` value is not affected by debug offline mode
- All components that check network status via `useNetwork()` will see the simulated offline state
- This includes upload queue processing, upload buttons, and any other network-dependent features

## Related Documentation

- [NetInfo Integration](./NETINFO_INTEGRATION.md) - Details about network state management
- [Upload Sync](./UPLOAD_SYNC_FIX.md) - Information about upload queue functionality
