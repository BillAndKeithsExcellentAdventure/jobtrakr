import React, { createContext, useContext, useCallback, useMemo, useRef, useState } from 'react';

interface ProjectDetailsStoreCacheContextType {
  addStoreToCache: (projectId: string, store: any) => void;
  removeStoreFromCache: (projectId: string) => void;
  getStoreFromCache: (projectId: string) => any | null;
  cacheVersion: number;
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
  const [cacheVersion, setCacheVersion] = useState(0);

  const addStoreToCache = useCallback((projectId: string, store: any) => {
    storesCacheRef.current[projectId] = store;
    setCacheVersion((version) => version + 1);
    console.log(`ProjectDetailsStoreCache: Added store for project ${projectId}`);
  }, []);

  const removeStoreFromCache = useCallback((projectId: string) => {
    delete storesCacheRef.current[projectId];
    setCacheVersion((version) => version + 1);
    console.log(`ProjectDetailsStoreCache: Removed store for project ${projectId}`);
  }, []);

  const getStoreFromCache = useCallback((projectId: string) => {
    return storesCacheRef.current[projectId] || null;
  }, []);

  const value = useMemo<ProjectDetailsStoreCacheContextType>(
    () => ({
      addStoreToCache,
      removeStoreFromCache,
      getStoreFromCache,
      cacheVersion,
    }),
    [addStoreToCache, removeStoreFromCache, getStoreFromCache, cacheVersion],
  );

  return (
    <ProjectDetailsStoreCacheContext.Provider value={value}>
      {children}
    </ProjectDetailsStoreCacheContext.Provider>
  );
};
