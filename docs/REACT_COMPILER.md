# React Compiler Setup

This document describes the React Compiler integration in ProjectHound.

## Overview

The React Compiler (formerly React Forget) is a build-time compiler that automatically optimizes React components for better performance. It eliminates the need for manual memoization with `useMemo`, `useCallback`, and `memo` by automatically optimizing component re-renders.

## Installation

The React Compiler has been enabled in this project with the following packages:

- **babel-plugin-react-compiler** (v1.0.0): Babel plugin that performs the compilation
- **eslint-plugin-react-compiler** (v19.1.0-rc.2): ESLint plugin that checks for code patterns incompatible with the compiler

## Configuration

### Expo Configuration

The React Compiler is enabled in `app.config.ts` via the experiments flag:

```typescript
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  // ... rest of config
});
```

### Babel Configuration

The React Compiler is configured in `babel.config.js`:

```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'babel-plugin-react-compiler',
        {
          // Recommended options for production
        },
      ],
    ],
  };
};
```

### ESLint Configuration

The ESLint plugin is configured in `eslint.config.js` to catch code patterns that are incompatible with the React Compiler:

```javascript
{
  plugins: {
    'react-compiler': reactCompiler,
  },
  rules: {
    'react-compiler/react-compiler': 'error',
  },
}
```

## Benefits

1. **Automatic Optimization**: Components are automatically optimized without manual `useMemo`, `useCallback`, or `memo` usage
2. **Better Performance**: Reduces unnecessary re-renders automatically
3. **Simpler Code**: Less boilerplate code for performance optimization
4. **Type Safety**: Works seamlessly with TypeScript

## Compatibility

- **React Version**: 19.1.0 (React Compiler requires React 19+)
- **React Native**: 0.81.5
- **Expo SDK**: ~54.0
- **TypeScript**: 5.9

## Usage Guidelines

### What the Compiler Handles

The React Compiler automatically:
- Memoizes component output
- Memoizes expensive computations
- Optimizes hook dependencies
- Prevents unnecessary re-renders

### Code Patterns to Avoid

The ESLint plugin will warn about incompatible patterns such as:
- Mutating values returned from `useState()` directly
- Breaking React's rules of hooks
- Improper use of refs

### Issues Found in Codebase

The ESLint plugin detected 8 React Compiler violations in the following files:

- `src/app/(protected)/(home)/add-project.tsx`
- `src/app/(protected)/(home)/configuration/workcategory/workCategories.tsx`
- `src/components/CostSummaryItem.tsx`
- `src/components/DeviceMediaList.tsx`
- `src/components/ProjectList.tsx`
- `src/components/SwipeableChangeOrder.tsx`
- `src/components/SwipeableChangeOrderItem.tsx`
- `src/components/SwipeableProposedChangeOrderItem.tsx`

Example issue:
```
src/app/(protected)/(home)/add-project.tsx
92:11  error  Mutating a value returned from 'useState()', which should not be mutated. 
              Use the setter function to update instead  react-compiler/react-compiler
```

These issues should be addressed to ensure the React Compiler can properly optimize the code. The violations are mostly related to:
- Mutating values returned from `useState()` 
- Mutating variables that React considers immutable
- Disabled ESLint rules in components

## Testing

To verify the React Compiler is working:

1. **Run ESLint**: `npm run lint` - Should show any incompatible code patterns
2. **Start Development Server**: `npm start` - Metro should compile successfully
3. **Build the App**: Create a development build and verify performance improvements

## Further Reading

- [React Compiler Documentation](https://react.dev/learn/react-compiler)
- [React Compiler Playground](https://playground.react.dev/)
- [React 19 Release Notes](https://react.dev/blog/2024/12/05/react-19)

## Troubleshooting

If you encounter issues:

1. Ensure React version is 19+ (check `package.json`)
2. Clear Metro cache: `npx expo start --clear`
3. Check ESLint output for incompatible patterns
4. Review the official React Compiler documentation for known issues
