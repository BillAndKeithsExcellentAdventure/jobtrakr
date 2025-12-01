# Auto-Save Feature Implementation

## Problem Statement

The application needed an auto-save mechanism that would update the store as values change in input fields, triggered by the `onBlur` event rather than on every keystroke. The previous implementation attempted to use `HeaderBackButton` with manual `blur()` calls, but this approach had several issues:

1. **Race Conditions**: Using `requestAnimationFrame` to wait for blur to complete was unreliable
2. **Inconsistent Blur Behavior**: Manual blur calls on refs didn't work consistently with React Native's focus management
3. **No Completion Guarantee**: There was no guarantee that blur events completed before navigation occurred
4. **Special Cases**: `NumberInputField` and `OptionPickerItem` (when editable) didn't always properly trigger their blur handlers when the back button was pressed

## Solution Overview

The solution implements a centralized **FocusManager** system that:

- Tracks all focusable input fields globally
- Ensures all fields are properly blurred before navigation
- Uses `setTimeout` to wait for blur operations to complete
- Works seamlessly with existing input components

## Architecture

### 1. FocusManager Hook (`src/hooks/useFocusManager.tsx`)

The core of the solution consists of three exported items:

#### `FocusManagerProvider`

A React context provider that maintains a registry of all focusable fields in the application.

```typescript
<FocusManagerProvider>{/* Your app components */}</FocusManagerProvider>
```

#### `useFocusManager()`

A hook that components use to register their blur handlers with the FocusManager.

```typescript
const focusManager = useFocusManager();
focusManager.registerField(fieldId, () => inputRef.current?.blur());
```

#### `useAutoSaveNavigation(onNavigateBack)`

A hook for screens that handles the back navigation with auto-save behavior.

```typescript
const handleBackPress = useAutoSaveNavigation(() => {
  // Save any pending data
  router.back();
});
```

### 2. Component Integration

#### NumberInputField

- Registers with FocusManager on mount using `useId()` for unique identification
- Calls its blur handler when FocusManager triggers `blurAllFields()`
- Made FocusManager optional (gracefully degrades when not available)

#### OptionPickerItem

- Registers with FocusManager when `editable=true`
- Unregisters when unmounted or when editable changes to false
- Made FocusManager optional

#### TextField

- Registers with FocusManager when not disabled
- Unregisters when unmounted or when disabled changes to true
- Made FocusManager optional

### 3. Screen Integration

Screens with `HeaderBackButton` now use `useAutoSaveNavigation`:

```typescript
const handleBackPress = useAutoSaveNavigation(() => {
  updateData(id, data); // Save any pending state
  router.back();
});

<Stack.Screen
  options={{
    headerLeft: () => <HeaderBackButton onPress={handleBackPress} />,
  }}
/>;
```

## How It Works

1. **Field Registration**:

   - When an input field mounts, it registers its blur function with FocusManager
   - Each field gets a unique ID from React's `useId()` hook
   - The blur function is stored in a `Map` for efficient access

2. **Navigation with Auto-Save**:

   - User presses the back button
   - `useAutoSaveNavigation` calls `blurAllFields()`
   - All registered blur functions are called synchronously
   - `setTimeout` waits for React to finish processing
   - Navigation occurs after all blur operations complete

3. **Cleanup**:
   - When a field unmounts, it automatically unregisters from FocusManager
   - This prevents memory leaks and stale references

## Updated Files

### New Files

- `src/hooks/useFocusManager.tsx` - Core FocusManager implementation

### Modified Files

- `src/app/_layout.tsx` - Added FocusManagerProvider to app root
- `src/components/NumberInputField.tsx` - Integrated with FocusManager
- `src/components/OptionPickerItem.tsx` - Integrated with FocusManager
- `src/components/TextField.tsx` - Integrated with FocusManager
- `src/app/(protected)/(home)/[projectId]/receipt/[receiptId]/edit.tsx` - Uses useAutoSaveNavigation
- `src/app/(protected)/(home)/[projectId]/receipt/[receiptId]/addLineItem.tsx` - Uses useAutoSaveNavigation
- `src/app/(protected)/(home)/configuration/template/[templateId]/edit.tsx` - Uses useAutoSaveNavigation

## Benefits

1. **Reliability**: No more race conditions or timing issues
2. **Consistency**: All input fields blur in the same way
3. **Maintainability**: Centralized focus management logic
4. **Extensibility**: Easy to add new input components
5. **Backward Compatible**: Works even when FocusManager is not available
6. **Clean Code**: Removes complex `requestAnimationFrame` and manual blur logic from screens

## Future Enhancements

Potential improvements for the future:

1. **Debouncing**: Add optional debouncing to blur operations
2. **Validation**: Integrate form validation before navigation
3. **Dirty State Tracking**: Track which fields have unsaved changes
4. **Custom Blur Behavior**: Allow fields to specify custom blur behavior
5. **Focus Restoration**: Restore focus when returning to a screen

## Testing Recommendations

When testing this feature:

1. Navigate between screens while editing fields
2. Test with NumberInputField focused
3. Test with OptionPickerItem (editable) focused
4. Test with TextField focused
5. Verify data is saved correctly on back navigation
6. Test on both iOS and Android platforms
7. Test with keyboard visible and hidden states
