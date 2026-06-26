// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    linterOptions: {
      reportUnusedDisableDirectives: false,
    },
    rules: {
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
      'react-hooks/exhaustive-deps': 'off',
      'react-hooks/refs': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'import/no-duplicates': 'off',
    },
  },
  {
    files: [
      'src/components/BottomSheetContainer.tsx',
      'src/components/CustomerPicker.tsx',
      'src/components/OptionPicker.tsx',
      'src/components/CameraView.tsx',
      'src/components/CostItemPicker.tsx',
      'src/components/DeleteProjectConfirmationModal.tsx',
      'src/components/DeviceMediaList.tsx',
      'src/components/HorizontalActivityIndicator.tsx',
      'src/components/InvoiceSummaryEditModal.tsx',
      'src/components/MapLocation.tsx',
      'src/components/NumericInput.tsx',
      'src/components/OptionList.tsx',
      'src/components/OptionPickerItem.tsx',
      'src/components/PercentCompleteBar.tsx',
      'src/components/ProjectMediaList.tsx',
      'src/components/Switch.tsx',
      'src/components/ReceiptSummaryEditModal.tsx',
      'src/components/VideoPlayerModal.tsx',
      'src/components/useClientOnlyValue.web.ts',
      'src/context/NetworkContext.tsx',
    ],
    rules: {
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
]);
