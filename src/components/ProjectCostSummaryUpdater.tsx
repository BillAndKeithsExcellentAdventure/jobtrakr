import React from 'react';
import { useActiveProjectIds } from '@/src/context/ActiveProjectIdsContext';
import {
  useCostUpdater,
  useBidAmountUpdater,
  useProjectWorkItemIdsUpdater,
  useSeedWorkItemsIfNecessary,
  useWorkItemSpentUpdater,
} from '@/src/tbStores/projectDetails/ProjectDetailsStoreHooks';

/**
 * ProjectUpdaterForSingleProject
 *
 * A non-rendering component that runs all cost/bid update hooks for a single project.
 * Extracted from ProjectCostSummaryUpdater so hooks are never called inside a loop.
 */
const ProjectUpdaterForSingleProject: React.FC<{ projectId: string }> = ({ projectId }) => {
  useSeedWorkItemsIfNecessary(projectId);
  useCostUpdater(projectId);
  useBidAmountUpdater(projectId);
  useProjectWorkItemIdsUpdater(projectId);
  useWorkItemSpentUpdater(projectId);
  return null;
};

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

  return (
    <>
      {activeProjectIds.map((projectId) => (
        <ProjectUpdaterForSingleProject key={projectId} projectId={projectId} />
      ))}
    </>
  );
};
