/**
 * Tests for ModalScreenContainer component
 *
 * Verifies that the Save button fires on the first press even when the
 * keyboard is open (keyboardShouldPersistTaps="handled" on the scroll view).
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ModalScreenContainer } from '@/src/components/ModalScreenContainer';
import { ColorsProvider } from '@/src/context/ColorsContext';
import { FocusManagerProvider } from '@/src/hooks/useFocusManager';
import { Text } from 'react-native';

jest.mock('react-native-keyboard-controller', () => ({
  KeyboardAwareScrollView: ({ children, keyboardShouldPersistTaps, ...rest }: any) => {
    const { View } = require('react-native');
    return (
      <View testID="keyboard-aware-scroll-view" keyboardShouldPersistTaps={keyboardShouldPersistTaps} {...rest}>
        {children}
      </View>
    );
  },
  KeyboardToolbar: () => null,
}));

jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children, ...rest }: any) => <View {...rest}>{children}</View>,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <FocusManagerProvider>
    <ColorsProvider>{children}</ColorsProvider>
  </FocusManagerProvider>
);

describe('ModalScreenContainer', () => {
  const mockOnSave = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders Save and Cancel buttons', () => {
    const { getByText } = render(
      <ModalScreenContainer onSave={mockOnSave} onCancel={mockOnCancel}>
        <Text>Content</Text>
      </ModalScreenContainer>,
      { wrapper },
    );

    expect(getByText('Save')).toBeTruthy();
    expect(getByText('Cancel')).toBeTruthy();
  });

  it('calls onSave on the first press of the Save button', () => {
    const { getByText } = render(
      <ModalScreenContainer onSave={mockOnSave} onCancel={mockOnCancel}>
        <Text>Content</Text>
      </ModalScreenContainer>,
      { wrapper },
    );

    fireEvent.press(getByText('Save'));

    expect(mockOnSave).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when Cancel button is pressed', () => {
    const { getByText } = render(
      <ModalScreenContainer onSave={mockOnSave} onCancel={mockOnCancel}>
        <Text>Content</Text>
      </ModalScreenContainer>,
      { wrapper },
    );

    fireEvent.press(getByText('Cancel'));

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('sets keyboardShouldPersistTaps="handled" on the scroll view so Save fires on first tap', () => {
    const { getByTestId } = render(
      <ModalScreenContainer onSave={mockOnSave} onCancel={mockOnCancel}>
        <Text>Content</Text>
      </ModalScreenContainer>,
      { wrapper },
    );

    const scrollView = getByTestId('keyboard-aware-scroll-view');
    expect(scrollView.props.keyboardShouldPersistTaps).toBe('handled');
  });

  it('does not call onSave when canSave is false', () => {
    const { getByText } = render(
      <ModalScreenContainer onSave={mockOnSave} onCancel={mockOnCancel} canSave={false}>
        <Text>Content</Text>
      </ModalScreenContainer>,
      { wrapper },
    );

    fireEvent.press(getByText('Save'));

    expect(mockOnSave).not.toHaveBeenCalled();
  });
});
