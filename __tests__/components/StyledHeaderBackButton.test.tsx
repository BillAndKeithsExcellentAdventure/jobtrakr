/**
 * Tests for StyledHeaderBackButton component
 *
 * Verifies that the tintColor adapts to light and dark mode so the button is
 * visible in both themes.
 */
import React from 'react';
import { render } from '@testing-library/react-native';
import { StyledHeaderBackButton } from '@/src/components/StyledHeaderBackButton';
import { ColorsProvider } from '@/src/context/ColorsContext';
import { tintColorLight, tintColorDark } from '@/src/constants/Colors';

jest.mock('@react-navigation/elements', () => ({
  HeaderBackButton: (props: any) => {
    const { View } = require('react-native');
    return <View testID="header-back-button" {...props} />;
  },
}));

// Allow per-test control of the color scheme
const mockUseColorScheme = jest.fn(() => 'light');
jest.mock('@/src/components/useColorScheme', () => ({
  useColorScheme: () => mockUseColorScheme(),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ColorsProvider>{children}</ColorsProvider>
);

describe('StyledHeaderBackButton', () => {
  beforeEach(() => {
    mockUseColorScheme.mockReturnValue('light');
  });

  it('uses the theme tint color in light mode', () => {
    mockUseColorScheme.mockReturnValue('light');

    const { getByTestId } = render(<StyledHeaderBackButton />, { wrapper });
    const button = getByTestId('header-back-button');
    expect(button.props.tintColor).toBe(tintColorLight);
  });

  it('uses the theme tint color in dark mode', () => {
    mockUseColorScheme.mockReturnValue('dark');

    const { getByTestId } = render(<StyledHeaderBackButton />, { wrapper });
    const button = getByTestId('header-back-button');
    expect(button.props.tintColor).toBe(tintColorDark);
  });

  it('tintColor is not the hardcoded iOS-only blue #007AFF', () => {
    const { getByTestId } = render(<StyledHeaderBackButton />, { wrapper });
    const button = getByTestId('header-back-button');
    expect(button.props.tintColor).not.toBe('#007AFF');
  });
});

