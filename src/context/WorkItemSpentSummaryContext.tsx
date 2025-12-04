import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';

// Define the WorkItemSpentSummary type
// IMPORTANT - workItemId is the workItemId NOT the id of the WorkItemSummaryData.
// This is because the receipts are linked to the workItem and category.
export interface WorkItemSpentSummary {
  workItemId: string;
  spentAmount: number;
}

// Map from projectId to a map of workItemId -> WorkItemSpentSummary
type WorkItemSpentSummaryMap = Map<string, Map<string, WorkItemSpentSummary>>;

// Define the context type
type WorkItemSpentSummaryContextType = {
  getWorkItemSpentAmount: (projectId: string, workItemId: string) => number;
  setWorkItemSpentAmount: (projectId: string, workItemId: string, spentAmount: number) => void;
  clearProjectSummaries: (projectId: string) => void;
};

// Create the context with an initial undefined value
const WorkItemSpentSummaryContext = createContext<WorkItemSpentSummaryContextType | undefined>(
  undefined,
);

// Provider props type
type WorkItemSpentSummaryProviderProps = {
  children: ReactNode;
};

// Provider component
export const WorkItemSpentSummaryProvider: React.FC<WorkItemSpentSummaryProviderProps> = ({
  children,
}) => {
  const [summariesMap, setSummariesMap] = useState<WorkItemSpentSummaryMap>(new Map());

  const getWorkItemSpentAmount = useCallback(
    (projectId: string, workItemId: string): number => {
      const projectMap = summariesMap.get(projectId);
      if (!projectMap) return 0;
      const summary = projectMap.get(workItemId);
      return summary?.spentAmount ?? 0;
    },
    [summariesMap],
  );

  const setWorkItemSpentAmount = useCallback(
    (projectId: string, workItemId: string, spentAmount: number) => {
      setSummariesMap((prev) => {
        const projectMap = prev.get(projectId);
        const existingSummary = projectMap?.get(workItemId);

        // Avoid unnecessary updates if the value hasn't changed
        if (existingSummary && existingSummary.spentAmount === spentAmount) {
          return prev;
        }

        const newMap = new Map(prev);
        let newProjectMap = projectMap ? new Map(projectMap) : new Map();
        newProjectMap.set(workItemId, { workItemId, spentAmount });
        newMap.set(projectId, newProjectMap);
        return newMap;
      });
    },
    [],
  );

  const clearProjectSummaries = useCallback((projectId: string) => {
    setSummariesMap((prev) => {
      const newMap = new Map(prev);
      newMap.delete(projectId);
      return newMap;
    });
  }, []);

  const contextValue = useMemo(
    () => ({
      getWorkItemSpentAmount,
      setWorkItemSpentAmount,
      clearProjectSummaries,
    }),
    [getWorkItemSpentAmount, setWorkItemSpentAmount, clearProjectSummaries],
  );

  return (
    <WorkItemSpentSummaryContext.Provider value={contextValue}>
      {children}
    </WorkItemSpentSummaryContext.Provider>
  );
};

// Custom hook for consuming the context
export const useWorkItemSpentSummary = (): WorkItemSpentSummaryContextType => {
  const context = useContext(WorkItemSpentSummaryContext);
  if (!context) {
    throw new Error(
      'useWorkItemSpentSummary must be used within a WorkItemSpentSummaryProvider',
    );
  }
  return context;
};
