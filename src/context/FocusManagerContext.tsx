import React, { createContext, useContext, useRef, ReactNode } from 'react';

type FocusCallback = () => void;

interface FocusManagerContextType {
  registerField: (fieldId: string, callback: FocusCallback) => void;
  unregisterField: (fieldId: string) => void;
  blurAll: () => void;
}

const FocusManagerContext = createContext<FocusManagerContextType | undefined>(undefined);

export function FocusManagerProvider({ children }: { children: ReactNode }) {
  const fieldsRef = useRef<Map<string, FocusCallback>>(new Map());

  const registerField = (fieldId: string, callback: FocusCallback) => {
    fieldsRef.current.set(fieldId, callback);
  };

  const unregisterField = (fieldId: string) => {
    fieldsRef.current.delete(fieldId);
  };

  const blurAll = () => {
    fieldsRef.current.forEach((callback) => {
      callback();
    });
  };

  return (
    <FocusManagerContext.Provider value={{ registerField, unregisterField, blurAll }}>
      {children}
    </FocusManagerContext.Provider>
  );
}

export function useFocusManager() {
  const context = useContext(FocusManagerContext);
  if (!context) {
    throw new Error('useFocusManager must be used within a FocusManagerProvider');
  }
  return context;
}
