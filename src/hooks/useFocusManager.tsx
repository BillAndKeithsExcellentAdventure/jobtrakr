import { createContext, useContext, useCallback, useRef } from 'react';

interface FieldRegistration {
  blur: () => void;
  getCurrentValue?: () => unknown;
}

interface FocusManagerContextType {
  registerField: (id: string, blur: () => void, getCurrentValue?: () => unknown) => void;
  unregisterField: (id: string) => void;
  blurAllFields: () => Promise<void>;
  /**
   * Gets the current value from a registered field by calling its getCurrentValue callback.
   * This is useful when you need to get the current input value before blur has been triggered.
   * Returns undefined if the field is not registered or doesn't have a getCurrentValue callback.
   */
  getFieldValue: <T = unknown>(id: string) => T | undefined;
}

const FocusManagerContext = createContext<FocusManagerContextType | null>(null);

export { FocusManagerContext };

export const FocusManagerProvider = ({ children }: { children: React.ReactNode }) => {
  const fieldsRef = useRef<Map<string, FieldRegistration>>(new Map());

  const registerField = useCallback((id: string, blur: () => void, getCurrentValue?: () => unknown) => {
    fieldsRef.current.set(id, { blur, getCurrentValue });
  }, []);

  const unregisterField = useCallback((id: string) => {
    fieldsRef.current.delete(id);
  }, []);

  const blurAllFields = useCallback(async () => {
    // Blur all registered fields
    fieldsRef.current.forEach((field) => {
      field.blur();
    });

    // Wait for all interactions to complete
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, 0);
    });
  }, []);

  const getFieldValue = useCallback(<T = unknown,>(id: string): T | undefined => {
    const field = fieldsRef.current.get(id);
    if (field?.getCurrentValue) {
      return field.getCurrentValue() as T;
    }
    return undefined;
  }, []);

  return (
    <FocusManagerContext.Provider value={{ registerField, unregisterField, blurAllFields, getFieldValue }}>
      {children}
    </FocusManagerContext.Provider>
  );
};

export const useFocusManager = () => {
  const context = useContext(FocusManagerContext);
  if (!context) {
    throw new Error('useFocusManager must be used within a FocusManagerProvider');
  }
  return context;
};

/**
 * Hook for components that need auto-save navigation behavior
 * Returns a function that should be called when navigation back is requested
 */
export const useAutoSaveNavigation = (onNavigateBack: () => void) => {
  const context = useContext(FocusManagerContext);

  const handleBackPress = useCallback(async () => {
    if (context) {
      // If FocusManager is available, blur all fields first
      await context.blurAllFields();
    }
    // Navigate back after blur is complete
    onNavigateBack();
  }, [context, onNavigateBack]);

  return handleBackPress;
};
