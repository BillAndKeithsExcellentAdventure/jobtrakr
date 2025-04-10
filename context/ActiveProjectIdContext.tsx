import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define the context type
type ActiveProjectIdContextType = {
  activeProjectId: string;
  setActiveProjectId: (id: string) => void;
};

// Create the context with an initial undefined value
const ActiveProjectIdContext = createContext<ActiveProjectIdContextType | undefined>(undefined);

// Provider props type
type ActiveProjectIdProviderProps = {
  children: ReactNode;
};

// Provider component
export const ActiveProjectIdProvider: React.FC<ActiveProjectIdProviderProps> = ({ children }) => {
  const [activeProjectId, setActiveProjectId] = useState<string>('');

  return (
    <ActiveProjectIdContext.Provider value={{ activeProjectId, setActiveProjectId }}>
      {children}
    </ActiveProjectIdContext.Provider>
  );
};

// Custom hook for consuming the context
export const useActiveProjectId = (): ActiveProjectIdContextType => {
  const context = useContext(ActiveProjectIdContext);
  if (!context) {
    throw new Error('useActiveProject must be used within an ActiveProjectProvider');
  }
  return context;
};
