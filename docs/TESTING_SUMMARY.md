# Testing Infrastructure Setup - Summary

## What Was Added

This PR adds a comprehensive testing infrastructure to the ProjectHound repository, including:

### 1. Testing Dependencies

The following packages were installed:

- **jest**: Testing framework
- **jest-expo**: Expo-specific Jest preset
- **@testing-library/react-native**: Testing utilities for React Native components
- **@types/jest**: TypeScript support for Jest
- **ts-jest**: TypeScript transformation for Jest
- **react-test-renderer**: Required peer dependency for React Native Testing Library

### 2. Configuration Files

#### jest.config.js

Main Jest configuration file that:

- Uses the `jest-expo` preset for Expo compatibility
- Configures module name mapping for the `@/` path alias
- Sets up ignore patterns for node_modules (except specific packages)
- Configures coverage thresholds
- Specifies test file patterns

#### jest.setup.js

Global test setup file that:

- Mocks all Expo modules (expo-router, expo-file-system, expo-sqlite, etc.)
- Mocks React Native community modules (@react-native-community/netinfo)
- Mocks authentication (Clerk)
- Mocks WebSocket connections
- Sets up global test utilities

### 3. Mock Utilities

#### **mocks**/apiMocks.ts

Provides utilities for mocking API calls:

- `mockApiSuccess(data)` - Mock successful API responses
- `mockApiError(status, message)` - Mock API errors
- `mockApiTimeout()` - Mock network timeouts
- `mockNetworkError()` - Mock network failures
- `resetApiMocks()` - Reset all mocks
- `createMockGetToken(token, shouldFail)` - Mock Clerk authentication
- `MockWebSocket` class - Mock WebSocket connections

#### **mocks**/fileMock.js

Simple mock for static file imports (images, etc.)

### 4. Current Test Suites (Repository Snapshot)

The repository currently includes tests under:

- `__tests__/components/`
  - `DeleteProjectConfirmationModal.test.tsx`
  - `ModalScreenContainer.test.tsx`
  - `NumericInput.test.tsx`
  - `NumericInputField.test.tsx`
- `__tests__/tbStores/`
  - `projectAbbreviation.test.ts`
  - `ReceiptQueueStore.test.tsx`
  - `useVendorMatch.test.ts`
- `__tests__/utils/`
  - `apiWithToken.test.ts`
  - `array.test.ts`
  - `csvUtils.test.ts`
  - `formatters.test.ts`
  - `quickbooksAPI.test.ts`

For exact per-suite test counts, run `npm test -- --no-watchAll`.

### 5. Documentation

#### docs/TESTING_GUIDE.md

Comprehensive testing guide covering:

- How to run tests
- How to write new tests
- How to mock API calls and external dependencies
- Best practices for testing
- Troubleshooting common issues
- Examples and code snippets

### 6. Package.json Updates

Added three test scripts:

```json
"test": "jest",                    // Run tests once
"test:watch": "jest --watchAll",   // Run tests in watch mode
"test:coverage": "jest --coverage" // Run tests with coverage report
```

### 7. Other Updates

- **.gitignore**: Added `coverage/` directory to ignore test coverage reports
- **README.md**: Updated to mention testing and link to the testing guide

## Test Results

Test counts and coverage are expected to evolve over time.

Run the following to view current status:

```bash
npm test -- --no-watchAll
npm test -- --coverage --no-watchAll
```

### Current Coverage Policy

The project enforces a minimum coverage threshold of 50% for statements, branches, functions, and lines (configured in `jest.config.js`).

## How to Use

### Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run specific test file
npm test -- __tests__/utils/formatters.test.ts

# Run tests matching a pattern
npm test -- --testNamePattern="formatCurrency"
```

### Writing New Tests

1. Create a test file in `__tests__/` directory matching your source file structure
2. Import the function/component to test
3. Import mock utilities from `__mocks__/apiMocks.ts` if needed
4. Write test cases using Jest's `describe` and `it` blocks
5. Run tests to verify they pass

Example:

```typescript
import { myFunction } from '@/src/utils/myUtils';

describe('myUtils', () => {
  describe('myFunction', () => {
    it('should do something', () => {
      const result = myFunction('input');
      expect(result).toBe('expected');
    });
  });
});
```

### Mocking API Calls

All server API calls are mocked by default. Use the mock utilities:

```typescript
import { mockApiSuccess, resetApiMocks } from '@/__mocks__/apiMocks';

describe('my API test', () => {
  beforeEach(() => resetApiMocks());

  it('should handle API response', async () => {
    mockApiSuccess({ data: 'success' });
    // Your test code here
  });
});
```

## Next Steps

To expand test coverage, consider adding tests for:

1. **Components**: Test React components with proper context providers
2. **Stores**: Test TinyBase store operations and hooks
3. **Navigation**: Test routing and navigation flows
4. **Integration Tests**: Test complete user workflows
5. **E2E Tests**: Consider adding end-to-end tests with Detox or Maestro

## Benefits

This testing infrastructure provides:

1. **Fast feedback**: Tests run quickly without needing a device/emulator
2. **Confidence**: Catch bugs before they reach production
3. **Documentation**: Tests serve as living documentation of how code should work
4. **Refactoring safety**: Make changes with confidence that tests will catch regressions
5. **CI/CD ready**: Tests can run in continuous integration pipelines

## References

- [Jest Documentation](https://jestjs.io/)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Testing Guide](TESTING_GUIDE.md) - Comprehensive guide in this repository
