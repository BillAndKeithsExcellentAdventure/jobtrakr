/**
 * Tests for the NumericInputField component.
 *
 * Covers:
 * - Renders label and input when label is provided
 * - Omits label when label prop is absent or empty
 * - Default label txtSize is applied
 * - labelStyle, labelTxtSize, containerStyle overrides are accepted
 * - Numeric input interactions are delegated to NumericInput
 * - maxDecimals restriction is forwarded to NumericInput
 */
import React, { useState } from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { NumericInputField } from '@/src/components/NumericInputField';
import { ColorsProvider } from '@/src/context/ColorsContext';

// ---------------------------------------------------------------------------
// ColorsContext wrapper (required by NumericInput internally)
// ---------------------------------------------------------------------------
const wrapper = ({ children }: { children: React.ReactNode }) => <ColorsProvider>{children}</ColorsProvider>;

describe('NumericInputField', () => {
  // -------------------------------------------------------------------------
  // Label rendering
  // -------------------------------------------------------------------------
  describe('label', () => {
    it('renders the label text when label prop is supplied', () => {
      const { getByText } = render(
        <NumericInputField label="Qty" value={null} onChangeNumber={jest.fn()} testID="input" />,
        { wrapper },
      );
      expect(getByText('Qty')).toBeTruthy();
    });

    it('does not render a label element when label prop is omitted', () => {
      const { queryByTestId } = render(
        <NumericInputField value={null} onChangeNumber={jest.fn()} testID="input" />,
        { wrapper },
      );
      expect(queryByTestId('label')).toBeNull();
    });

    it('does not render a label element when label is an empty string', () => {
      const { queryByText } = render(
        <NumericInputField label="" value={null} onChangeNumber={jest.fn()} testID="input" />,
        { wrapper },
      );
      expect(queryByText('')).toBeNull();
    });

    it('accepts a custom labelTxtSize without throwing', () => {
      expect(() =>
        render(
          <NumericInputField
            label="Price"
            labelTxtSize="standard"
            value={null}
            onChangeNumber={jest.fn()}
            testID="input"
          />,
          { wrapper },
        ),
      ).not.toThrow();
    });

    it('accepts a labelStyle override without throwing', () => {
      expect(() =>
        render(
          <NumericInputField
            label="Price"
            labelStyle={{ color: 'red', marginBottom: 8 }}
            value={null}
            onChangeNumber={jest.fn()}
            testID="input"
          />,
          { wrapper },
        ),
      ).not.toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // Container
  // -------------------------------------------------------------------------
  describe('container', () => {
    it('renders a container view', () => {
      const { getByTestId } = render(
        <NumericInputField testID="input" label="Amount" value={null} onChangeNumber={jest.fn()} />,
        { wrapper },
      );
      // The component renders fine (container wraps the label + input)
      expect(getByTestId('input')).toBeTruthy();
    });

    it('accepts a containerStyle override without throwing', () => {
      expect(() =>
        render(
          <NumericInputField
            label="Width"
            containerStyle={{ padding: 16, backgroundColor: '#eee' }}
            value={null}
            onChangeNumber={jest.fn()}
            testID="input"
          />,
          { wrapper },
        ),
      ).not.toThrow();
    });

    it('applies inputStyle overrides to the NumericInput element', () => {
      const inputStyle = { borderColor: 'blue', borderRadius: 12 };
      const { getByTestId } = render(
        <NumericInputField
          label="Amount"
          inputStyle={inputStyle}
          value={null}
          onChangeNumber={jest.fn()}
          testID="input"
        />,
        { wrapper },
      );
      const style = getByTestId('input').props.style;
      // NumericInput nests the incoming style, so flatten recursively
      const flattenStyle = (s: unknown): object =>
        Array.isArray(s) ? Object.assign({}, ...s.filter(Boolean).map(flattenStyle)) : ((s as object) ?? {});
      const flat = flattenStyle(style);
      expect((flat as Record<string, unknown>).borderColor).toBe('blue');
      expect((flat as Record<string, unknown>).borderRadius).toBe(12);
    });
  });

  // -------------------------------------------------------------------------
  // Input behavior (delegated to NumericInput)
  // -------------------------------------------------------------------------
  describe('input behavior', () => {
    it('displays the initial numeric value', () => {
      const { getByTestId } = render(
        <NumericInputField value={42} onChangeNumber={jest.fn()} testID="input" />,
        { wrapper },
      );
      expect(getByTestId('input').props.value).toBe('42');
    });

    it('displays an empty string when value is null', () => {
      const { getByTestId } = render(
        <NumericInputField value={null} onChangeNumber={jest.fn()} testID="input" />,
        { wrapper },
      );
      expect(getByTestId('input').props.value).toBe('');
    });

    it('calls onChangeNumber with the parsed value on text change', () => {
      const onChangeNumber = jest.fn();
      const { getByTestId } = render(
        <NumericInputField value={null} onChangeNumber={onChangeNumber} testID="input" />,
        { wrapper },
      );

      fireEvent.changeText(getByTestId('input'), '7.5');

      expect(onChangeNumber).toHaveBeenCalledWith(7.5);
    });

    it('calls onChangeNumber with null when input is cleared', () => {
      const onChangeNumber = jest.fn();
      const { getByTestId } = render(
        <NumericInputField value={10} onChangeNumber={onChangeNumber} testID="input" />,
        { wrapper },
      );

      fireEvent.changeText(getByTestId('input'), '');

      expect(onChangeNumber).toHaveBeenCalledWith(null);
    });

    it('ignores non-numeric characters', () => {
      const onChangeNumber = jest.fn();
      const { getByTestId } = render(
        <NumericInputField value={null} onChangeNumber={onChangeNumber} testID="input" />,
        { wrapper },
      );

      fireEvent.changeText(getByTestId('input'), 'abc');

      expect(onChangeNumber).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // maxDecimals forwarding
  // -------------------------------------------------------------------------
  describe('maxDecimals', () => {
    it('rejects input that exceeds maxDecimals', () => {
      const onChangeNumber = jest.fn();
      const { getByTestId } = render(
        <NumericInputField value={null} onChangeNumber={onChangeNumber} maxDecimals={2} testID="input" />,
        { wrapper },
      );

      fireEvent.changeText(getByTestId('input'), '1.234');

      expect(onChangeNumber).not.toHaveBeenCalled();
    });

    it('accepts input within maxDecimals limit', () => {
      const onChangeNumber = jest.fn();
      const { getByTestId } = render(
        <NumericInputField value={null} onChangeNumber={onChangeNumber} maxDecimals={2} testID="input" />,
        { wrapper },
      );

      fireEvent.changeText(getByTestId('input'), '1.23');

      expect(onChangeNumber).toHaveBeenCalledWith(1.23);
    });
  });

  // -------------------------------------------------------------------------
  // Controlled value synchronization
  // -------------------------------------------------------------------------
  describe('controlled value synchronization', () => {
    const ControlledField = ({ initialValue }: { initialValue: number | null }) => {
      const [value, setValue] = useState<number | null>(initialValue);
      return <NumericInputField testID="input" label="Test" value={value} onChangeNumber={setValue} />;
    };

    it('updates the displayed text when the value prop changes externally', () => {
      const onChangeNumber = jest.fn();
      const { getByTestId, rerender } = render(
        <NumericInputField testID="input" value={1} onChangeNumber={onChangeNumber} />,
        { wrapper },
      );

      rerender(<NumericInputField testID="input" value={99} onChangeNumber={onChangeNumber} />);

      expect(getByTestId('input').props.value).toBe('99');
    });

    it('clears displayed text when value prop is set to null externally', () => {
      const onChangeNumber = jest.fn();
      const { getByTestId, rerender } = render(
        <NumericInputField testID="input" value={5} onChangeNumber={onChangeNumber} />,
        { wrapper },
      );

      rerender(<NumericInputField testID="input" value={null} onChangeNumber={onChangeNumber} />);

      expect(getByTestId('input').props.value).toBe('');
    });

    it('propagates typed value through controlled state correctly', () => {
      const { getByTestId } = render(<ControlledField initialValue={null} />, { wrapper });

      fireEvent.changeText(getByTestId('input'), '3.14');

      expect(getByTestId('input').props.value).toBe('3.14');
    });
  });
});
