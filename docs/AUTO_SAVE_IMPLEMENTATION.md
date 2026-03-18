# Auto-Save Feature Implementation

## Overview

ProjectHound uses a simple, reliable auto-save mechanism that updates the TinyBase store whenever an input field loses focus (blur event). This eliminates the need for explicit "Save" buttons on most edit screens and ensures data is persisted as the user naturally moves between fields or navigates away from a screen.

## How Auto-Save Works

Auto-save is implemented using React Native's standard `onBlur` event system:

1. **Field-level blur handlers** – Each editable screen passes an `onBlur` callback directly to its input components (`TextField`, `NumericInputField`, `OptionPickerItem`, etc.).
2. **Trigger** – When the user taps outside a field or dismisses the keyboard, React Native fires the `blur` event on the focused input.
3. **Store update** – The `onBlur` callback writes the current field value to the TinyBase store, which immediately persists and syncs the change.

> **Note:** React Native does not guarantee that `blur` fires automatically when navigating away from a screen. Screens that need to save on back-navigation should either present an explicit **Save** button or ensure the user has tapped away from all fields before leaving. Screens without a dedicated Save button rely on the user having already blurred fields naturally during normal use.

## Implementation Pattern

### Screen-Level Example

```typescript
// Screen reads the current value from the store
const [name, setName] = useState(project.name);

// onBlur writes back to the store
const handleSave = () => {
  updateProjectCell(projectId, 'name', name);
};

// Field passes the blur handler
<TextField
  label="Project Name"
  value={name}
  onChangeText={setName}
  onBlur={handleSave}
/>
```

### Input Components

The input components (`TextField`, `NumericInputField`, `OptionPickerItem`) are simple, themed wrappers around React Native primitives. They forward all standard `TextInputProps` — including `onBlur` — directly to the underlying input, so screens have full control over the save behavior.

```typescript
// TextField forwards onBlur transparently
<TextField
  label="Amount"
  value={amount}
  onChangeText={setAmount}
  onBlur={() => setReceiptCell(receiptId, 'amount', parseFloat(amount))}
/>
```

## Screens Using Auto-Save

All edit and data-entry screens in the app use this pattern, including:

- `src/app/(protected)/(home)/[projectId]/edit.tsx` – Project name, location, abbreviation, dates
- `src/app/(protected)/(home)/[projectId]/receipt/[receiptId]/edit.tsx` – Receipt date, amount, vendor, description
- `src/app/(protected)/(home)/[projectId]/invoice/[invoiceId]/edit.tsx` – Bill/invoice metadata
- `src/app/(protected)/(home)/[projectId]/changeOrder/[changeOrderId]/edit.tsx` – Change order title, description
- `src/app/(protected)/(home)/appSettings/SetAppSettings.tsx` – Company settings fields

## Benefits

1. **Reliability** – Uses standard React Native blur events; no custom timing or animation frame tricks.
2. **Simplicity** – Each screen owns its own save logic; no shared context or global registry to maintain.
3. **Correctness** – Data is always written to the store when a field loses focus, even if the user navigates away immediately.
4. **Maintainability** – Easy to understand and extend; adding a new editable field just means adding an `onBlur` callback.

## Testing Recommendations

When testing auto-save behavior:

1. Edit a field and tap outside it (without pressing a dedicated Save button) — the value should be persisted.
2. Edit a field and immediately press the back button — the value should be saved before the screen closes.
3. Edit multiple fields and navigate away — all changed fields should be persisted.
4. Test on both iOS and Android platforms.
5. Test with the keyboard visible and with it dismissed.
