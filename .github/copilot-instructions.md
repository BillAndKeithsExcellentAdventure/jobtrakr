# GitHub Copilot Instructions for ProjectHound

This document provides guidance for GitHub Copilot when working with the ProjectHound codebase.

## Quick Start

For developers new to the codebase:

1. **Install dependencies**: `npm install`
2. **Start development server**: `npm run dev` (for development build) or `npm start` (standard)
3. **Run on device**: `npm run android` or `npm run ios`
4. **Lint code**: `npm run lint`
5. **Run tests**: `npm test`

**Key first steps**:
- Review `README.md` for project overview and features
- Check `docs/` folder for detailed documentation on specific topics
- Understand the TinyBase store architecture (see "Data Management" section below)
- Review the Auto-Save system in `docs/AUTO_SAVE_IMPLEMENTATION.md`

## Project Overview

ProjectHound is a mobile-first construction project management application built with React Native, Expo, and TypeScript. It helps contractors manage projects, track costs, handle documentation, and streamline financial workflows with real-time multi-device synchronization.

## Technology Stack

- **React Native 0.81.5** with **Expo SDK ~54.0**
- **TypeScript 5.9** with strict mode enabled
- **TinyBase 6.7+** for reactive data stores with mergeable synchronization
- **expo-router** for file-based navigation with typed routes
- **Clerk** for authentication and organization-based multi-tenancy
- **expo-maps** for Google Maps (Android) and Apple Maps (iOS)

## App Variants and Environment

The app supports multiple build variants configured in `app.config.ts`:

- **Production**: `com.projecthound.app` - Production environment
- **Development**: `com.projecthound.app.dev` - Development environment with dev tools enabled
- **Preview**: `com.projecthound.app.preview` - Preview environment for testing

Set the variant using `APP_VARIANT` environment variable:
```bash
APP_VARIANT=development npm run dev
```

Build configurations are managed through `eas.json` for iOS and Android builds.

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

1. **Configuration Store**: Global configuration including categories, cost items, templates, and vendors
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

## Anti-Patterns to Avoid

### Don'ts

**Data Access**:
- ❌ DON'T access TinyBase stores directly without hooks in components
- ❌ DON'T bypass the auto-save system by saving data on every keystroke
- ❌ DON'T mutate store data directly - always use store setter methods

**UI Components**:
- ❌ DON'T import components from `react-native` when themed alternatives exist
- ❌ DON'T create custom color implementations - use `ColorsContext` and themed components
- ❌ DON'T use `FlatList` for large lists - prefer `@shopify/flash-list`

**Navigation**:
- ❌ DON'T navigate away from edit screens without implementing `useAutoSaveNavigation()`
- ❌ DON'T use imperative navigation when declarative routing is available
- ❌ DON'T bypass authentication checks on protected routes

**Performance**:
- ❌ DON'T create new objects/arrays in render without memoization
- ❌ DON'T forget dependency arrays in useEffect/useCallback/useMemo
- ❌ DON'T perform expensive computations in render without useMemo

**Dependencies**:
- ❌ DON'T add non-Expo-compatible packages without verification
- ❌ DON'T update package versions without testing thoroughly
- ❌ DON'T install packages when existing alternatives are available

**Testing**:
- ❌ DON'T skip writing tests for business logic
- ❌ DON'T mock everything - test real behavior when possible
- ❌ DON'T commit code without running tests

### Common Mistakes

1. **Forgetting to register input fields** with `useFocusManager()` - leads to lost data on navigation
2. **Not using themed components** - breaks dark mode and color consistency
3. **Accessing stores without hooks** - breaks reactivity and causes stale data
4. **Skipping TypeScript types** - reduces code quality and IDE support
5. **Not handling offline scenarios** - breaks user experience when network is unavailable

## Testing

- Test framework: Jest with `jest-expo` preset
- Test runner: `npm test` (single run), `npm run test:watch` (watch mode), `npm run test:coverage` (with coverage)
- Testing library: `@testing-library/react-native` for component testing
- Configuration files:
  - `jest.config.js` - Main Jest configuration
  - `jest.setup.js` - Global test setup and mocks
  - `__mocks__/` - Mock utilities and files
- Coverage thresholds: 50% for statements, branches, functions, and lines
- Focus on testing:
  - Business logic and data transformations
  - TinyBase store operations
  - Component behavior and user interactions
  - API integration points
- Detailed testing documentation available in `docs/TESTING_GUIDE.md`
- Mock patterns for Expo modules and external dependencies are pre-configured
- Always run tests before committing significant changes

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
- Image capture: Use `expo-camera` and `expo-image-picker`
- Image processing: Use `expo-image-manipulator` for transformations
- Thumbnail generation: Automatic for images and videos
- Media organization: ZIP archives for bulk export (with automatic splitting for large files)
- See `src/utils/mediaAssetsHelper.ts` and `src/utils/thumbnailUtils.ts`

### CSV Import/Export

- See documentation in `docs/` for specific import/export patterns
- Use `src/utils/csvUtils.ts` for CSV operations
- Follow existing patterns for data validation and transformation
- Key documentation:
  - `docs/COSTITEM_CSV_IMPORT.md` - Cost item CSV import patterns
  - `docs/VENDOR_CSV_IMPORT_EXPORT.md` - Vendor CSV import/export

### Change Orders and Document Generation

- Use Mustache templates for HTML generation
- See `src/utils/renderChangeOrderTemplate.ts`
- HTML files are generated to FileSystem and shared via native share sheet
- Templates support custom branding and formatting

### API Integration

- Backend API: See `docs/PROJECTHOUND_BACKEND_API.md` for backend API documentation
- API calls with token handling: Use `src/utils/apiWithToken.ts` for automatic token refresh
- Network status: Use `NetworkContext` for offline/online detection
- QuickBooks integration: See `src/utils/quickbooksAPI.tsx` for QuickBooks integration patterns

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
- Token refresh: Automatic via `apiWithToken` utility
- Environment variables: Use `app.config.ts` for configuration

## Error Handling

- Handle network errors gracefully - check `NetworkContext` for connectivity status
- Use try-catch blocks for async operations
- Provide user-friendly error messages
- Log errors appropriately for debugging
- Handle offline mode: See `docs/DEBUG_OFFLINE_MODE.md` and `docs/NETINFO_INTEGRATION.md`
- Validate user input before processing
- Handle edge cases in data transformations

## Common Utilities

- **Formatters**: `src/utils/formatters.ts` - currency, dates, etc.
- **Arrays**: `src/utils/array.ts` - array manipulation helpers
- **Images**: `src/utils/images.tsx` - image processing
- **Sharing**: `src/utils/sharing.ts` - social media and file sharing
- **API with Token**: `src/utils/apiWithToken.ts` - API calls with automatic token refresh
- **Environment**: `src/utils/environment.ts` - environment configuration helpers
- **CSV Utils**: `src/utils/csvUtils.ts` - CSV parsing and generation
- **HTML Generator**: `src/utils/htmlFileGenerator.ts` - HTML file generation utilities

## Contexts Available

The app provides several React contexts for global state:

- **ColorsContext**: Theme colors for light/dark mode
- **NetworkContext**: Network connectivity status (online/offline)
- **ActiveProjectIdsContext**: Currently active project IDs
- **LocationContext**: Location services and permissions
- **WorkItemSpentSummaryContext**: Cost tracking summaries

Use these contexts via their respective hooks rather than accessing directly.

## Custom Hooks

Key custom hooks available in `src/hooks/`:

- **useFocusManager**: Register input fields for auto-save functionality
  - Returns methods to register/unregister blur handlers
  - Essential for any editable screen
  
- **useAutoSaveNavigation**: Handle back navigation with auto-save
  - Ensures all fields are blurred before navigating back
  - Use in all edit/create screens
  
- **useProjectWorkItems**: Access project work items and cost categories
  - Provides categorized work items for a project
  - Includes filtering and sorting logic

- **useUploadQueue**: Manage file upload queue
  - Track upload status and progress
  - Handle retries and failures

- **useColorScheme**: Get current color scheme (light/dark)
  - Reactive to system theme changes
  - From `src/components/useColorScheme`

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

**Key Documentation Files**:
- `docs/AUTO_SAVE_IMPLEMENTATION.md` - Auto-save system architecture
- `docs/TESTING_GUIDE.md` - Comprehensive testing guide
- `docs/TESTING_SUMMARY.md` - Testing overview and patterns
- `docs/PROJECTHOUND_BACKEND_API.md` - Backend API documentation
- `docs/COSTITEM_CSV_IMPORT.md` - Cost item CSV import patterns
- `docs/VENDOR_CSV_IMPORT_EXPORT.md` - Vendor CSV operations
- `docs/PROJECT_DELETION.md` - Project deletion workflow
- `docs/NETINFO_INTEGRATION.md` - Network connectivity integration
- `docs/DEBUG_OFFLINE_MODE.md` - Debugging offline functionality
- `docs/DEFERRED_MEDIA_PROCESSING.md` - Media processing architecture
- `docs/HOME_SCREENS_USER_GUIDE.md` - Home screen user guide

## Debugging Tips

- Use React Native debugger or Flipper
- Enable Expo dev client for better debugging experience
- Check TinyBase store state with provided debugging tools
- Use `console.log` sparingly - prefer debugger breakpoints
- Network debugging: Use `NetworkContext` to check connectivity status
- Offline mode: See `docs/DEBUG_OFFLINE_MODE.md` for debugging offline scenarios

## Troubleshooting Common Issues

### Build Issues
- Clear cache: `npx expo start -c`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check Expo SDK compatibility for all packages

### TinyBase Sync Issues
- Check WebSocket connection status in store synchronization
- Verify organization ID is correctly set
- Review `src/tbStores/synchronization/` for sync configuration

### Auto-Save Not Working
- Ensure fields are registered with `useFocusManager()`
- Verify `useAutoSaveNavigation()` is implemented on the screen
- Check that blur handlers are properly configured

### Testing Issues
- Review mock configurations in `jest.setup.js`
- Check `__mocks__/` for module mocks
- Ensure all Expo modules are properly mocked

### Type Errors
- Run TypeScript compiler: `npx tsc --noEmit`
- Check that all imports use correct path aliases (`@/`)
- Verify types are defined in `src/models/types.ts`

## Git Practices

- Follow conventional commits when possible
- Keep commits focused and atomic
- Update `.gitignore` if adding new build artifacts or temp files
