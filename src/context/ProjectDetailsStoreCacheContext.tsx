import React, { createContext, useContext, useCallback, useMemo, useRef, useState } from 'react';

/**
 * Public API for the project-details store cache.
 *
 * The cache keeps in-memory references to active project TinyBase stores so
 * cross-project workflows (for example, receipt queue processing) can read/write
 * target project data without navigating to each project screen.
 */
interface ProjectDetailsStoreCacheContextType {
  addStoreToCache: (projectId: string, store: any) => void;
  removeStoreFromCache: (projectId: string) => void;
  getStoreFromCache: (projectId: string) => any | null;
  /**
   * Monotonic version that increments whenever a store is added/removed.
   *
   * Consumers use this as a reactive signal because store references are held in
   * a ref map (which does not trigger renders by itself). Including cacheVersion
   * in effect dependencies forces re-evaluation when cache membership changes.
   */
  cacheVersion: number;
}

/**
 * Context for accessing project-details stores currently loaded in memory.
 */
const ProjectDetailsStoreCacheContext = createContext<ProjectDetailsStoreCacheContextType | undefined>(
  undefined,
);

/**
 * Hook for reading/writing the project-details store cache.
 *
 * Must be used inside ProjectDetailsStoreCacheProvider.
 */
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

/**
 * Provider that owns an in-memory map of projectId -> TinyBase store reference.
 *
 * Notes:
 * - storesCacheRef is intentionally a ref so reads/writes are O(1) and do not
 *   cause rerenders for every cache mutation.
 * - cacheVersion provides the reactive change signal for consumers that need to
 *   re-run effects when cache availability changes (for example, queue retries
 *   after a target project store has finished loading).
 */
export const ProjectDetailsStoreCacheProvider = ({ children }: ProjectDetailsStoreCacheProviderProps) => {
  const storesCacheRef = useRef<Record<string, any>>({});
  const [cacheVersion, setCacheVersion] = useState(0);

  /** Adds or replaces the cached store for a project and bumps cacheVersion. */
  const addStoreToCache = useCallback((projectId: string, store: any) => {
    storesCacheRef.current[projectId] = store;
    setCacheVersion((version) => version + 1);
    console.log(`ProjectDetailsStoreCache: Added store for project ${projectId}`);
  }, []);

  /** Removes a project store from cache and bumps cacheVersion. */
  const removeStoreFromCache = useCallback((projectId: string) => {
    delete storesCacheRef.current[projectId];
    setCacheVersion((version) => version + 1);
    console.log(`ProjectDetailsStoreCache: Removed store for project ${projectId}`);
  }, []);

  /** Returns the cached store reference for a project, or null if unavailable. */
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
