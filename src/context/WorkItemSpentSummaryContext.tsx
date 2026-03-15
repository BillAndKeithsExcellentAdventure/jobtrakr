import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';

/**
 * WorkItemSpentSummary context/provider.
 *
 * This module stores a per-project, per-work-item spent cache in memory so screens can
 * read spent totals with O(1) lookups.
 *
 * For architecture, data flow, and maintenance guidance, see:
 * docs/MAINTAINING_PROJECT_COSTS.md
 */

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
  // Read spent amount for a single work item in a project (returns 0 when not present).
  getWorkItemSpentAmount: (projectId: string, workItemId: string) => number;

  // Read a snapshot map of workItemId -> spentAmount for one project.
  getProjectWorkItemSpentAmounts: (projectId: string) => Map<string, number>;

  // Set a single work item spent amount.
  setWorkItemSpentAmount: (projectId: string, workItemId: string, spentAmount: number) => void;

  // Replace the full project spent map in one write.
  // This is the preferred write path because it also clears removed work items.
  setProjectWorkItemSpentAmounts: (projectId: string, spentByWorkItem: Map<string, number>) => void;

  // Remove all cached spent values for a project.
  clearProjectSummaries: (projectId: string) => void;
};

// Create the context with an initial undefined value
const WorkItemSpentSummaryContext = createContext<WorkItemSpentSummaryContextType | undefined>(undefined);

// Provider props type
type WorkItemSpentSummaryProviderProps = {
  children: ReactNode;
};

// Provider component
export const WorkItemSpentSummaryProvider: React.FC<WorkItemSpentSummaryProviderProps> = ({ children }) => {
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

  const getProjectWorkItemSpentAmounts = useCallback(
    (projectId: string): Map<string, number> => {
      const projectMap = summariesMap.get(projectId);
      if (!projectMap) return new Map();

      const spentByWorkItem = new Map<string, number>();
      for (const [workItemId, summary] of projectMap) {
        spentByWorkItem.set(workItemId, summary.spentAmount);
      }
      return spentByWorkItem;
    },
    [summariesMap],
  );

  const setWorkItemSpentAmount = useCallback((projectId: string, workItemId: string, spentAmount: number) => {
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
  }, []);

  const setProjectWorkItemSpentAmounts = useCallback(
    (projectId: string, spentByWorkItem: Map<string, number>) => {
      setSummariesMap((prev) => {
        const existingProjectMap = prev.get(projectId);

        if (spentByWorkItem.size === 0) {
          if (!existingProjectMap) return prev;
          const newMap = new Map(prev);
          newMap.delete(projectId);
          return newMap;
        }

        if (existingProjectMap && existingProjectMap.size === spentByWorkItem.size) {
          let hasChanges = false;
          for (const [workItemId, spentAmount] of spentByWorkItem) {
            if (existingProjectMap.get(workItemId)?.spentAmount !== spentAmount) {
              hasChanges = true;
              break;
            }
          }
          if (!hasChanges) return prev;
        }

        const newProjectMap = new Map<string, WorkItemSpentSummary>();
        for (const [workItemId, spentAmount] of spentByWorkItem) {
          newProjectMap.set(workItemId, { workItemId, spentAmount });
        }

        const newMap = new Map(prev);
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
      getProjectWorkItemSpentAmounts,
      setWorkItemSpentAmount,
      setProjectWorkItemSpentAmounts,
      clearProjectSummaries,
    }),
    [
      getWorkItemSpentAmount,
      getProjectWorkItemSpentAmounts,
      setWorkItemSpentAmount,
      setProjectWorkItemSpentAmounts,
      clearProjectSummaries,
    ],
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
    throw new Error('useWorkItemSpentSummary must be used within a WorkItemSpentSummaryProvider');
  }
  return context;
};
