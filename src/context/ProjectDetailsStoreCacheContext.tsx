import React, { createContext, useContext, useCallback, useRef } from 'react';

interface ProjectDetailsStoreCacheContextType {
  addStoreToCache: (projectId: string, store: any) => void;
  removeStoreFromCache: (projectId: string) => void;
  getStoreFromCache: (projectId: string) => any | null;
}

const ProjectDetailsStoreCacheContext = createContext<ProjectDetailsStoreCacheContextType | undefined>(
  undefined,
);

export const useProjectDetailsStoreCache = () => {
  const context = useContext(ProjectDetailsStoreCacheContext);
  if (!context) {
    throw new Error('useProjectDetailsStoreCache must be used within ProjectDetailsStoreCacheProvider');
  }
  return context;
};

interface ProjectDetailsStoreCacheProviderProps {
  children: React.ReactNode;
}

export const ProjectDetailsStoreCacheProvider = ({ children }: ProjectDetailsStoreCacheProviderProps) => {
  const storesCacheRef = useRef<Record<string, any>>({});

  const addStoreToCache = useCallback((projectId: string, store: any) => {
    storesCacheRef.current[projectId] = store;
    console.log(`ProjectDetailsStoreCache: Added store for project ${projectId}`);
  }, []);

  const removeStoreFromCache = useCallback((projectId: string) => {
    delete storesCacheRef.current[projectId];
    console.log(`ProjectDetailsStoreCache: Removed store for project ${projectId}`);
  }, []);

  const getStoreFromCache = useCallback((projectId: string) => {
    return storesCacheRef.current[projectId] || null;
  }, []);

  const value: ProjectDetailsStoreCacheContextType = {
    addStoreToCache,
    removeStoreFromCache,
    getStoreFromCache,
  };

  return (
    <ProjectDetailsStoreCacheContext.Provider value={value}>
      {children}
    </ProjectDetailsStoreCacheContext.Provider>
  );
};
