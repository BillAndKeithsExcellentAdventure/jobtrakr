# Testing Guide for ProjectHound

This document provides comprehensive guidance on testing the ProjectHound codebase, including how to run tests, write new tests, and mock API calls and external dependencies.

## Table of Contents

- [Overview](#overview)
- [Test Infrastructure](#test-infrastructure)
- [Running Tests](#running-tests)
- [Test Structure](#test-structure)
- [Writing Tests](#writing-tests)
- [Mocking API Calls](#mocking-api-calls)
- [Mocking Expo Modules](#mocking-expo-modules)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

ProjectHound uses **Jest** as the testing framework with **@testing-library/react-native** for React component testing. The test infrastructure is configured to:

- Mock all Expo modules and external APIs
- Support TypeScript tests
- Provide utilities for mocking API calls and WebSocket connections
- Run tests quickly without needing a physical device or emulator

## Test Infrastructure

### Dependencies

The following testing dependencies are installed:

- **jest**: Core testing framework
- **jest-expo**: Jest preset for Expo projects
- **@testing-library/react-native**: Testing utilities for React Native components
- **@types/jest**: TypeScript definitions for Jest
- **ts-jest**: TypeScript support for Jest
- **react-test-renderer**: Required for React Native Testing Library

### Configuration Files

1. **jest.config.js**: Main Jest configuration
2. **jest.setup.js**: Global test setup and mocks
3. **__mocks__/**: Directory containing mock utilities and files

## Running Tests

### Run All Tests

```bash
npm test -- --no-watchAll
```

This runs all tests once without watch mode.

### Run Tests in Watch Mode

```bash
npm test
```

Jest will watch for file changes and re-run affected tests.

### Run Specific Test File

```bash
npm test -- __tests__/utils/formatters.test.ts --no-watchAll
```

### Run Tests with Coverage

```bash
npm test -- --coverage --no-watchAll
```

This generates a coverage report showing which parts of your code are tested.

### Run Tests Matching Pattern

```bash
npm test -- --testNamePattern="formatCurrency" --no-watchAll
```

Runs only tests whose name matches the pattern.

## Test Structure

Tests are organized in the `__tests__` directory, mirroring the `src` structure:

```
__tests__/
├── components/       # Component tests
├── hooks/            # Custom hook tests
└── utils/            # Utility function tests
```

### Test File Naming

- Test files should end with `.test.ts` or `.test.tsx`
- Name test files after the file they're testing
- Example: `formatters.ts` → `formatters.test.ts`

## Writing Tests

### Basic Test Structure

```typescript
/**
 * Tests for <feature name>
 */
import { functionToTest } from '@/src/utils/myUtils';

describe('myUtils', () => {
  describe('functionToTest', () => {
    it('should do something specific', () => {
      const result = functionToTest('input');
      expect(result).toBe('expected output');
    });

    it('should handle edge cases', () => {
      expect(functionToTest(null)).toBe('default value');
    });
  });
});
```

### Testing Utility Functions

Utility functions are the easiest to test since they have no dependencies on React or external modules.

**Example: Testing a formatter function**

```typescript
import { formatCurrency } from '@/src/utils/formatters';

describe('formatters', () => {
  describe('formatCurrency', () => {
    it('should format currency with dollar sign', () => {
      const result = formatCurrency(1234.56, true, true);
      expect(result).toBe('$1,234.56');
    });

    it('should handle null values', () => {
      const result = formatCurrency(null);
      expect(result).toBe('');
    });
  });
});
```

### Testing Functions with Dependencies

For functions that depend on external modules or APIs, use Jest's mocking capabilities.

**Example: Testing API calls**

```typescript
import { createApiWithToken } from '@/src/utils/apiWithToken';
import { mockApiSuccess, createMockGetToken, resetApiMocks } from '@/__mocks__/apiMocks';

describe('apiWithToken', () => {
  beforeEach(() => {
    resetApiMocks();
  });

  afterEach(() => {
    resetApiMocks();
  });

  it('should make authenticated API call', async () => {
    const mockGetToken = createMockGetToken('test-token');
    const apiFetch = createApiWithToken(mockGetToken);
    
    mockApiSuccess({ data: 'success' });
    
    const response = await apiFetch('https://api.example.com/test', {
      method: 'GET',
    });
    
    const data = await response.json();
    expect(data).toEqual({ data: 'success' });
    expect(mockGetToken).toHaveBeenCalled();
  });
});
```

## Mocking API Calls

The `__mocks__/apiMocks.ts` file provides utilities for mocking API calls.

### Available Mock Utilities

#### mockApiSuccess(data)

Mocks a successful API call that returns the specified data.

```typescript
import { mockApiSuccess } from '@/__mocks__/apiMocks';

mockApiSuccess({ id: '123', name: 'Test Project' });
```

#### mockApiError(status, message)

Mocks a failed API call with specific status code and error message.

```typescript
import { mockApiError } from '@/__mocks__/apiMocks';

mockApiError(404, 'Not Found');
```

#### mockApiTimeout()

Mocks a network timeout scenario.

```typescript
import { mockApiTimeout } from '@/__mocks__/apiMocks';

mockApiTimeout();
// Now API calls will throw a timeout error
```

#### mockNetworkError()

Mocks a generic network error.

```typescript
import { mockNetworkError } from '@/__mocks__/apiMocks';

mockNetworkError();
```

#### resetApiMocks()

Resets all API mocks to their default state. Call this in `beforeEach` or `afterEach`.

```typescript
beforeEach(() => {
  resetApiMocks();
});
```

#### createMockGetToken(token, shouldFail)

Creates a mock Clerk `getToken` function for testing authenticated API calls.

```typescript
import { createMockGetToken } from '@/__mocks__/apiMocks';

const mockGetToken = createMockGetToken('my-test-token');
// or simulate failure
const failingGetToken = createMockGetToken('', true);
```

### Example: Testing API Call with Error Handling

```typescript
import { createApiWithToken } from '@/src/utils/apiWithToken';
import { mockApiError, createMockGetToken, resetApiMocks } from '@/__mocks__/apiMocks';

describe('error handling', () => {
  beforeEach(() => resetApiMocks());
  afterEach(() => resetApiMocks());

  it('should handle 404 errors', async () => {
    const mockGetToken = createMockGetToken('token');
    const apiFetch = createApiWithToken(mockGetToken);
    
    mockApiError(404, 'Not Found');
    
    const response = await apiFetch('https://api.example.com/missing', {
      method: 'GET',
    });
    
    expect(response.status).toBe(404);
    expect(response.ok).toBe(false);
  });
});
```

## Mocking Expo Modules

Expo modules are pre-mocked in `jest.setup.js`. Here's what's already mocked:

### Pre-Mocked Modules

- **expo-router**: Navigation utilities
- **expo-secure-store**: Secure storage
- **expo-file-system**: File operations
- **expo-sqlite**: SQLite database
- **expo-image-picker**: Camera and gallery access
- **expo-location**: GPS and location services
- **expo-sharing**: File sharing
- **expo-haptics**: Haptic feedback
- **@react-native-community/netinfo**: Network status
- **@clerk/clerk-expo**: Authentication (useAuth, useOrganization, useUser)
- **reconnecting-websocket**: WebSocket connections

### Customizing Mocks for a Specific Test

If you need to override a mock for a specific test:

```typescript
jest.mock('expo-location', () => ({
  getCurrentPositionAsync: jest.fn(() =>
    Promise.resolve({
      coords: {
        latitude: 40.7128,
        longitude: -74.0060,
      },
    })
  ),
}));
```

### Mocking WebSocket Connections

Use the `MockWebSocket` class from `__mocks__/apiMocks.ts`:

```typescript
import { MockWebSocket } from '@/__mocks__/apiMocks';

describe('WebSocket synchronization', () => {
  it('should handle WebSocket messages', () => {
    const ws = new MockWebSocket();
    
    const messageHandler = jest.fn();
    ws.addEventListener('message', messageHandler);
    
    ws.simulateMessage({ type: 'update', data: 'test' });
    
    expect(messageHandler).toHaveBeenCalled();
  });
});
```

## Best Practices

### 1. Test File Organization

- Keep tests close to the code they test
- Use descriptive test names that explain what is being tested
- Group related tests using `describe` blocks

### 2. Test Independence

- Each test should be independent and not rely on other tests
- Use `beforeEach` and `afterEach` to reset state between tests
- Always reset mocks between tests

```typescript
beforeEach(() => {
  jest.clearAllMocks();
  resetApiMocks();
});
```

### 3. Meaningful Assertions

- Test behavior, not implementation details
- Use specific assertions (`toBe`, `toEqual`, `toContain`) rather than generic ones
- Test edge cases and error conditions

### 4. Avoid Testing External Libraries

- Don't test third-party library functionality
- Focus on testing your code's integration with libraries
- Mock external dependencies

### 5. Keep Tests Fast

- Mock slow operations (API calls, file I/O, databases)
- Don't test the same thing multiple times
- Run only necessary tests during development

### 6. Test Coverage

- Aim for meaningful coverage, not 100% coverage
- Focus on critical paths and business logic
- Don't test trivial code (simple getters/setters)

## Troubleshooting

### Issue: Tests are slow

**Solution**: Ensure you're mocking all external dependencies and not making real API calls or file operations.

### Issue: "Cannot find module" errors

**Solution**: Check your import paths. Use the `@/` alias for absolute imports from the project root.

```typescript
// Correct
import { formatDate } from '@/src/utils/formatters';

// Incorrect
import { formatDate } from '../../../src/utils/formatters';
```

### Issue: Expo module errors

**Solution**: Check if the module is mocked in `jest.setup.js`. If not, add a mock for it.

### Issue: TypeScript errors in tests

**Solution**: Ensure `@types/jest` is installed and your `tsconfig.json` includes test files.

### Issue: Tests pass locally but fail in CI

**Solution**: 
- Clear the Jest cache: `npx jest --clearCache`
- Ensure all dependencies are properly installed
- Check for environment-specific issues

### Getting More Help

- Review existing test files in `__tests__/` for examples
- Check Jest documentation: https://jestjs.io/docs/getting-started
- Check React Native Testing Library docs: https://callstack.github.io/react-native-testing-library/

## Adding New Tests

When adding a new feature or fixing a bug:

1. **Create a test file** in the appropriate `__tests__/` subdirectory
2. **Write tests first** (TDD approach) or alongside your code
3. **Run tests frequently** during development
4. **Ensure tests pass** before committing code
5. **Update this documentation** if you add new testing patterns or utilities

## Example Test Workflow

```bash
# 1. Create your feature and test file
# src/utils/myNewUtil.ts
# __tests__/utils/myNewUtil.test.ts

# 2. Run tests in watch mode while developing
npm test

# 3. Run all tests before committing
npm test -- --no-watchAll

# 4. Check coverage
npm test -- --coverage --no-watchAll

# 5. Commit your code and tests together
git add src/utils/myNewUtil.ts __tests__/utils/myNewUtil.test.ts
git commit -m "Add myNewUtil with tests"
```

## Summary

- Use `npm test -- --no-watchAll` to run all tests
- Mock API calls using utilities from `__mocks__/apiMocks.ts`
- Expo modules are pre-mocked in `jest.setup.js`
- Write focused, independent tests that verify behavior
- Keep tests fast by mocking external dependencies
- Run tests frequently during development

Happy testing! 🧪
