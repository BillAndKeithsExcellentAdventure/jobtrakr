import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

// Define the context type
type ActiveProjectIdsContextType = {
  activeProjectIds: string[];
  addActiveProjectIds: (ids: string | string[]) => void;
};

// Create the context with an initial undefined value
const ActiveProjectIdsContext = createContext<ActiveProjectIdsContextType | undefined>(undefined);

// Provider props type
type ActiveProjectIdsProviderProps = {
  children: ReactNode;
};

// Provider component
export const ActiveProjectIdsProvider: React.FC<ActiveProjectIdsProviderProps> = ({ children }) => {
  const [activeProjectIds, setActiveProjectIds] = useState<string[]>([]);

  const addActiveProjectIds = useCallback((ids: string | string[]) => {
    const idArray = Array.isArray(ids) ? ids : [ids];

    setActiveProjectIds((prevIds) => {
      const newIds = idArray.filter((id) => !prevIds.includes(id));
      if (newIds.length === 0) {
        return prevIds; // No change needed
      }
      return [...prevIds, ...newIds];
    });
  }, []);
  return (
    <ActiveProjectIdsContext.Provider value={{ activeProjectIds, addActiveProjectIds }}>
      {children}
    </ActiveProjectIdsContext.Provider>
  );
};

// Custom hook for consuming the context
export const useActiveProjectIds = (): ActiveProjectIdsContextType => {
  const context = useContext(ActiveProjectIdsContext);
  if (!context) {
    throw new Error('useActiveProjectId must be used within an ActiveProjectIdsProvider');
  }
  return context;
};
