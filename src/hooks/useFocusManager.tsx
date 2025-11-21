import { createContext, useContext, useCallback, useRef } from 'react';
import { InteractionManager } from 'react-native';

interface FocusManagerContextType {
  registerField: (id: string, blur: () => void) => void;
  unregisterField: (id: string) => void;
  blurAllFields: () => Promise<void>;
}

const FocusManagerContext = createContext<FocusManagerContextType | null>(null);

export { FocusManagerContext };

export const FocusManagerProvider = ({ children }: { children: React.ReactNode }) => {
  const fieldsRef = useRef<Map<string, () => void>>(new Map());

  const registerField = useCallback((id: string, blur: () => void) => {
    fieldsRef.current.set(id, blur);
  }, []);

  const unregisterField = useCallback((id: string) => {
    fieldsRef.current.delete(id);
  }, []);

  const blurAllFields = useCallback(async () => {
    // Blur all registered fields
    fieldsRef.current.forEach((blur) => {
      blur();
    });
    
    // Wait for all interactions to complete
    return new Promise<void>((resolve) => {
      InteractionManager.runAfterInteractions(() => {
        resolve();
      });
    });
  }, []);

  return (
    <FocusManagerContext.Provider value={{ registerField, unregisterField, blurAllFields }}>
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
