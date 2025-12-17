# GitHub Copilot Instructions for ProjectHound

This document provides guidance for GitHub Copilot when working with the ProjectHound codebase.

## Project Overview

ProjectHound is a mobile-first construction project management application built with React Native, Expo, and TypeScript. It helps contractors manage projects, track costs, handle documentation, and streamline financial workflows with real-time multi-device synchronization.

## Technology Stack

- **React Native 0.81.5** with **Expo SDK ~54.0**
- **TypeScript 5.9** with strict mode enabled
- **TinyBase 6.7+** for reactive data stores with mergeable synchronization
- **expo-router** for file-based navigation with typed routes
- **Clerk** for authentication and organization-based multi-tenancy
- **expo-maps** for Google Maps (Android) and Apple Maps (iOS)

## Development Workflow

### Building and Running

```bash
npm start          # Start Expo development server
npm run dev        # Start with development build
npm run android    # Run on Android
npm run ios        # Run on iOS
npm run lint       # Run ESLint
```

### Linting

- Uses ESLint with `eslint-config-expo`
- Run `npm run lint` before committing
- Configuration in `eslint.config.js`

### Code Formatting

- Uses Prettier with the following settings:
  - Single quotes
  - Semicolons
  - Trailing commas: all
  - Print width: 110 characters
  - Tab width: 2 spaces
- Configuration in `.prettierrc`

## Project Structure

```
src/
├── app/              # expo-router file-based routing
│   ├── (auth)/       # Authentication screens
│   └── (protected)/  # Protected screens requiring auth
├── components/       # Reusable React components
├── constants/        # App-wide constants
├── context/          # React contexts
├── hooks/            # Custom React hooks
├── models/           # TypeScript type definitions (types.ts)
├── tbStores/         # TinyBase store implementations
│   ├── appSettingsStore/      # User preferences
│   ├── configurationStore/    # Global configuration
│   ├── listOfProjects/        # Project list
│   ├── projectDetails/        # Per-project data
│   ├── persistence/           # SQLite persistence
│   └── synchronization/       # WebSocket sync
└── utils/            # Utility functions
```

## Architecture Principles

### Data Management with TinyBase

The application uses **TinyBase mergeable stores** for conflict-free replication across devices:

1. **Configuration Store**: Global configuration including categories, cost items, templates, vendors, and suppliers
2. **Project List Store**: All projects for the organization
3. **Project Details Store**: Per-project data including receipts, invoices, media, notes, and change orders
4. **App Settings Store**: User preferences and application settings
5. **Upload Sync Store**: Manages file upload synchronization

**Important**: Always use TinyBase's reactive hooks (e.g., `useRow`, `useCell`, `useTable`) for accessing data to ensure proper reactivity.

### Auto-Save System

The app uses a centralized **FocusManager** system for auto-save functionality:

- All input fields register with `useFocusManager()` hook
- Fields auto-save on blur events
- `useAutoSaveNavigation()` ensures all fields blur before navigation
- See `docs/AUTO_SAVE_IMPLEMENTATION.md` for detailed documentation

**When creating new input components**:

1. Use `useFocusManager()` to register the field
2. Provide a blur function that saves data
3. Unregister on unmount

### Navigation

- Uses **expo-router** with file-based routing
- Path parameters are strongly typed
- Protected routes require Clerk authentication
- Use `router.back()` or `router.push()` for navigation
- Wrap back navigation with `useAutoSaveNavigation()` for auto-save

## Code Style and Conventions

### TypeScript

- **Always use TypeScript** - no plain JavaScript files
- Enable strict mode (already configured in `tsconfig.json`)
- Define types in `src/models/types.ts` for domain models
- Use interfaces for data structures
- Use type aliases for union types or simple types
- Prefer explicit return types for functions

### React Components

- Use **functional components** with hooks
- Follow React hooks rules (useEffect, useState, etc.)
- Use `memo` for expensive components when appropriate
- Prefer named exports for components
- Components should be in PascalCase

### Naming Conventions

- **Files**: PascalCase for components (e.g., `Button.tsx`), camelCase for utilities
- **Variables/Functions**: camelCase
- **Types/Interfaces**: PascalCase
- **Constants**: UPPER_SNAKE_CASE for true constants
- **Hooks**: Start with `use` prefix (e.g., `useFocusManager`)

### Import Organization

Use path aliases defined in `tsconfig.json`:

```typescript
import { SomeComponent } from '@/src/components/SomeComponent';
import { SomeType } from '@/src/models/types';
```

### Component Patterns

#### Themed Components

**Always prefer themed components** from `src/components/Themed.tsx`:

```typescript
import { Text, View, TextInput } from '@/src/components/Themed';
```

**DO**:

```typescript
// Use themed components for automatic color adaptation
<View style={styles.container}>
  <Text txtSize="title">Hello World</Text>
  <Text txtSize="sub-title">Subtitle</Text>
  <TextInput placeholder="Enter text" />
</View>
```

**DON'T**:

```typescript
// Don't import directly from react-native unless absolutely necessary
import { View, Text, TextInput } from 'react-native';
```

Themed components automatically:

- Apply appropriate colors from `ColorsContext`
- Support light/dark mode switching
- Provide consistent styling across the app
- Include helpful props like `txtSize` for Text components

#### Input Components

All input components should:

1. Accept `onBlur` callback for auto-save
2. Register with FocusManager when focusable
3. Handle disabled/editable states
4. Use controlled components pattern

Example from `TextField.tsx` and `NumberInputField.tsx`.

#### Screen Components

Screen components should:

1. Use expo-router's `Stack.Screen` for configuration
2. Implement `useAutoSaveNavigation()` for back button handling
3. Use appropriate TinyBase hooks for data access
4. Handle loading and error states

#### Modal Components

- Use `ModalScreenContainer` or `ModalScreenContainerWithList` wrappers
- See component documentation: `src/components/ModalScreenContainer.md`

### Data Access Patterns

**DO**:

```typescript
// Use TinyBase hooks for reactivity
const projectName = useCell('projects', projectId, 'name', projectListStore);
const receipts = useTable('receipts', projectDetailsStore);
```

**DON'T**:

```typescript
// Don't access store directly without hooks in components
const project = store.getRow('projects', projectId);
```

### State Management

- Use TinyBase stores for persistent, synchronized data
- Use React `useState` only for ephemeral UI state (e.g., modal visibility)
- Use React `useReducer` for complex local state logic
- Avoid prop drilling - use context or TinyBase stores

## Testing

- Test framework: Jest (configured but minimal tests currently)
- Run tests with `npm test`
- Follow existing test patterns when adding new tests
- Focus on testing business logic and data transformations

## Common Patterns

### Adding a New Field to a Store

1. Update the store's table definition in the appropriate store file
2. Add getter/setter hooks in the store's hooks file
3. Update TypeScript types in `src/models/types.ts`
4. Handle migration if needed for existing data

### Creating a New Screen

1. Add file in appropriate `src/app/` directory following expo-router conventions
2. Use `Stack.Screen` for header configuration
3. Implement `useAutoSaveNavigation()` if editing data
4. Use TinyBase hooks for data access
5. Handle authentication if needed (protected routes)

### Working with Media

- Use `expo-image` for images (better performance than `Image`)
- Use `expo-video` for video playback
- Store media metadata in TinyBase, files in FileSystem
- See `src/utils/mediaAssetsHelper.ts` and `src/utils/thumbnailUtils.ts`

### CSV Import/Export

- See documentation in `docs/` for specific import/export patterns
- Use `src/utils/csvUtils.ts` for CSV operations
- Follow existing patterns for data validation and transformation

### Change Orders and Document Generation

- Use Mustache templates for HTML generation
- See `src/utils/renderChangeOrderTemplate.ts`
- HTML files are generated to FileSystem and shared via native share sheet

## Platform-Specific Considerations

### iOS

- Uses Apple Maps via expo-maps
- Native sharing via expo-sharing

### Android

- Uses Google Maps via expo-maps
- Edge-to-edge design enabled
- Build properties configured in `eas.json`

## Performance Considerations

- Use `@shopify/flash-list` instead of `FlatList` for large lists
- Use `react-native-reanimated` for animations
- Optimize images with `expo-image-manipulator`
- Avoid unnecessary re-renders with `memo` and proper dependency arrays

## Security

- Never commit secrets or API keys
- Use `expo-secure-store` for sensitive data
- Authentication handled by Clerk
- Organization-based data isolation

## Common Utilities

- **Formatters**: `src/utils/formatters.ts` - currency, dates, etc.
- **Arrays**: `src/utils/array.ts` - array manipulation helpers
- **Images**: `src/utils/images.tsx` - image processing
- **ZIP**: `src/utils/zip.ts` - archive creation with splitting
- **Sharing**: `src/utils/sharing.ts` - social media and file sharing

## Key Dependencies to Know

- **TinyBase**: Reactive data store - read the docs for proper usage patterns
- **expo-router**: File-based routing - understand dynamic routes with `[param]`
- **Clerk**: Authentication - use `useAuth()` and `useOrganization()` hooks
- **react-native-reanimated**: Animations - prefer over Animated API
- **expo-maps**: Maps - platform-specific (Google/Apple)

## When Adding Dependencies

1. Check if a similar package already exists in `package.json`
2. Prefer Expo-compatible packages (check Expo documentation)
3. Consider bundle size impact
4. Update this document if the dependency introduces new patterns

## Documentation

- Keep inline documentation concise and meaningful
- Update `docs/` folder for architectural decisions or complex features
- Use JSDoc comments for public APIs
- Document complex business logic

## Debugging Tips

- Use React Native debugger or Flipper
- Enable Expo dev client for better debugging experience
- Check TinyBase store state with provided debugging tools
- Use `console.log` sparingly - prefer debugger breakpoints

## Git Practices

- Follow conventional commits when possible
- Keep commits focused and atomic
- Update `.gitignore` if adding new build artifacts or temp files
