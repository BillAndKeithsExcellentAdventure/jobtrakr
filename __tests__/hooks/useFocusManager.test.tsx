/**
 * Tests for useFocusManager hook
 */
import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { FocusManagerProvider, useFocusManager } from '@/src/hooks/useFocusManager';

describe('useFocusManager', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <FocusManagerProvider>{children}</FocusManagerProvider>
  );

  it('should throw error when used outside FocusManagerProvider', () => {
    // Suppress console.error for this test
    const consoleError = console.error;
    console.error = jest.fn();

    expect(() => {
      renderHook(() => useFocusManager());
    }).toThrow('useFocusManager must be used within a FocusManagerProvider');

    console.error = consoleError;
  });

  it('should register and unregister fields', () => {
    const { result } = renderHook(() => useFocusManager(), { wrapper });

    const blurMock = jest.fn();

    act(() => {
      result.current.registerField('field1', blurMock);
    });

    // Field is registered (we can't directly check the map, but we can test blur behavior)
    expect(() => result.current.unregisterField('field1')).not.toThrow();
  });

  it('should blur all registered fields', async () => {
    const { result } = renderHook(() => useFocusManager(), { wrapper });

    const blur1 = jest.fn();
    const blur2 = jest.fn();
    const blur3 = jest.fn();

    act(() => {
      result.current.registerField('field1', blur1);
      result.current.registerField('field2', blur2);
      result.current.registerField('field3', blur3);
    });

    await act(async () => {
      await result.current.blurAllFields();
    });

    expect(blur1).toHaveBeenCalledTimes(1);
    expect(blur2).toHaveBeenCalledTimes(1);
    expect(blur3).toHaveBeenCalledTimes(1);
  });

  it('should get field value when getCurrentValue is provided', () => {
    const { result } = renderHook(() => useFocusManager(), { wrapper });

    const getValue = jest.fn(() => 'test value');
    const blur = jest.fn();

    act(() => {
      result.current.registerField('field1', blur, getValue);
    });

    const value = result.current.getFieldValue('field1');

    expect(value).toBe('test value');
    expect(getValue).toHaveBeenCalled();
  });

  it('should return undefined for field without getCurrentValue', () => {
    const { result } = renderHook(() => useFocusManager(), { wrapper });

    const blur = jest.fn();

    act(() => {
      result.current.registerField('field1', blur);
    });

    const value = result.current.getFieldValue('field1');

    expect(value).toBeUndefined();
  });

  it('should return undefined for unregistered field', () => {
    const { result } = renderHook(() => useFocusManager(), { wrapper });

    const value = result.current.getFieldValue('nonexistent');

    expect(value).toBeUndefined();
  });

  it('should handle multiple fields with getCurrentValue', () => {
    const { result } = renderHook(() => useFocusManager(), { wrapper });

    const getValue1 = jest.fn(() => 'value1');
    const getValue2 = jest.fn(() => 42);
    const blur = jest.fn();

    act(() => {
      result.current.registerField('field1', blur, getValue1);
      result.current.registerField('field2', blur, getValue2);
    });

    expect(result.current.getFieldValue('field1')).toBe('value1');
    expect(result.current.getFieldValue<number>('field2')).toBe(42);
  });

  it('should not blur unregistered fields', async () => {
    const { result } = renderHook(() => useFocusManager(), { wrapper });

    const blur1 = jest.fn();
    const blur2 = jest.fn();

    act(() => {
      result.current.registerField('field1', blur1);
      result.current.registerField('field2', blur2);
      result.current.unregisterField('field2');
    });

    await act(async () => {
      await result.current.blurAllFields();
    });

    expect(blur1).toHaveBeenCalledTimes(1);
    expect(blur2).not.toHaveBeenCalled();
  });
});
