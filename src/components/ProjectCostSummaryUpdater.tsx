import React from 'react';
import { useActiveProjectIds } from '@/src/context/ActiveProjectIdsContext';
import {
  useCostUpdater,
  useBidAmountUpdater,
  useSeedWorkItemsIfNecessary,
  useWorkItemSpentUpdater,
} from '@/src/tbStores/projectDetails/ProjectDetailsStoreHooks';

/**
 * ProjectCostSummaryUpdater
 *
 * A non-rendering component that manages automatic updates of project cost summaries
 * for all active projects. It consolidates the following hooks to keep project data
 * synchronized across the application:
 *
 * - useSeedWorkItemsIfNecessary: Seeds initial work items for new projects
 * - useCostUpdater: Updates total amount spent based on workItemCostEntries
 * - useBidAmountUpdater: Updates total bid amount based on workItemSummaries
 * - useWorkItemSpentUpdater: Updates per-work-item spent amounts in context
 *
 * By placing this component high in the component tree (in the protected layout),
 * it ensures these critical calculations run automatically for all active projects
 * without requiring individual screens to manage these hooks.
 *
 * This component should be placed within:
 * - ActiveProjectIdsProvider (to access active projects)
 * - WorkItemSpentSummaryProvider (for useWorkItemSpentUpdater)
 * - ActiveProjectDetailsStoreProvider (to ensure stores are available)
 *
 * @returns null - This component does not render any UI
 */
export const ProjectCostSummaryUpdater: React.FC = () => {
  const { activeProjectIds } = useActiveProjectIds();

  // Run updater hooks for each active project
  activeProjectIds.forEach((projectId) => {
    // Seed initial work items if the project is new
    useSeedWorkItemsIfNecessary(projectId);

    // Update total amount spent in ListOfProjectsStore
    useCostUpdater(projectId);

    // Update total bid amount in ListOfProjectsStore
    useBidAmountUpdater(projectId);

    // Update per-work-item spent amounts in WorkItemSpentSummaryContext
    useWorkItemSpentUpdater(projectId);
  });

  // This component doesn't render anything
  return null;
};
