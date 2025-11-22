# ModalScreenContainer

A reusable React Native component for creating consistent modal screens with a title, scrollable content area, and Save/Cancel buttons.

## Overview

`ModalScreenContainer` provides a standardized layout for modal screens in the app. It includes:
- A navigation header with customizable title
- An optional modal title displayed above the content
- Keyboard-aware scrolling
- Save and Cancel action buttons
- Consistent styling and spacing
- iOS keyboard toolbar support

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `title` | `string` | Yes | - | The title shown in the navigation header |
| `modalTitle` | `string` | No | - | Optional title displayed above the content area |
| `onSave` | `() => void` | Yes | - | Callback function called when Save button is pressed |
| `onCancel` | `() => void` | Yes | - | Callback function called when Cancel button is pressed |
| `canSave` | `boolean` | No | `true` | Controls whether the Save button is enabled or disabled |
| `saveButtonTitle` | `string` | No | `'Save'` | Custom label for the Save button |
| `cancelButtonTitle` | `string` | No | `'Cancel'` | Custom label for the Cancel button |
| `children` | `ReactNode` | Yes | - | The content to display in the modal |

## Usage Example

```tsx
import { ModalScreenContainer } from '@/src/components/ModalScreenContainer';
import { TextInput, View } from '@/src/components/Themed';
import { useRouter } from 'expo-router';
import { useState } from 'react';

const MyModalScreen = () => {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  
  const handleSave = () => {
    // Save logic here
    console.log('Saving:', { name, email });
    router.back();
  };
  
  const handleCancel = () => {
    router.back();
  };
  
  const isValid = name.length > 0 && email.length > 0;
  
  return (
    <ModalScreenContainer
      title="Add Contact"
      modalTitle="Create New Contact"
      onSave={handleSave}
      onCancel={handleCancel}
      canSave={isValid}
    >
      <TextInput
        placeholder="Name"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />
    </ModalScreenContainer>
  );
};

export default MyModalScreen;
```

## Features

### Keyboard Handling
The component automatically handles keyboard interactions:
- Uses `KeyboardAwareScrollView` to keep input fields visible when keyboard is shown
- Includes iOS keyboard toolbar when running on iOS
- Automatically scrolls content when keyboard appears

### Button States
The Save button can be in three states:
- **Enabled** (`canSave={true}`): Green button, clickable
- **Disabled** (`canSave={false}`): Grey button, not clickable
- The Cancel button is always enabled and red

### Styling
The component uses consistent styles from the template:
- Modal background with theme-aware colors
- Rounded corners on the modal container
- Proper spacing and padding
- Centered modal title (when provided)
- Full-width button row at the bottom

## Real-World Example

See `src/app/(protected)/(home)/add-project.tsx` for a complete implementation using this component.

## Notes

- The component uses the `useColors()` hook for theme-aware colors
- Navigation is handled via `expo-router`'s `Stack.Screen`
- The Save and Cancel callbacks must be provided by the parent component
- Content scrolling is handled automatically
- The component is TypeScript-ready with full type definitions
