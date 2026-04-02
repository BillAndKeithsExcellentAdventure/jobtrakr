# Maintaining Project Costs

This document explains how project cost totals are computed, cached, and displayed across the app.

## Purpose

Project cost screens need fast access to:

- spent per work item
- total spent by category or project
- completion profit totals based on bid amount and spent amount
- project-specific Cost Items available for receipt line item assignment

To avoid repeating expensive scans of workItemCostEntries in every screen, spent values are aggregated once and cached in context. Project-specific Cost Item availability is also denormalized into the project list store so receipt line-item pickers can populate options without requiring every project's ProjectDetailsStore to be loaded.

## Core Components

### 1) WorkItemSpentSummaryContext

File: src/context/WorkItemSpentSummaryContext.tsx

Responsibilities:

- Keeps an in-memory map keyed by projectId and workItemId.
- Provides O(1) read access to spent values.
- Supports both single-item updates and full-project map replacement.

Key APIs:

- getWorkItemSpentAmount(projectId, workItemId): number
- getProjectWorkItemSpentAmounts(projectId): Map<string, number>
- setWorkItemSpentAmount(projectId, workItemId, spentAmount): void
- setProjectWorkItemSpentAmounts(projectId, spentByWorkItem): void
- clearProjectSummaries(projectId): void

Preferred write API:

- Use setProjectWorkItemSpentAmounts for updater flows.
- It replaces the entire project snapshot and removes stale work items that no longer have costs.

### 2) ProjectCostSummaryUpdater

File: src/components/ProjectCostSummaryUpdater.tsx

Responsibilities:

- Runs updater hooks for each active project.
- Ensures totals are maintained globally while protected routes are mounted.
- Keeps project-level Cost Item indexes synchronized for active projects.

Hooks used:

- useSeedWorkItemsIfNecessary
- useCostUpdater
- useBidAmountUpdater
- useProjectWorkItemIdsUpdater
- useWorkItemSpentUpdater

### 3) ListOfProjectsStore Cost Item Index

File: src/tbStores/listOfProjects/ListOfProjectsStore.tsx

Responsibilities:

- Stores a denormalized `workItemIds` field on each project row.
- Keeps project-level Cost Item availability accessible from the lightweight project list store.
- Exposes active-project lookup helpers for picker flows.

Key fields and helpers:

- `projects.workItemIds`: comma-separated list of work item IDs currently available for that project
- `parseWorkItemIdsCsv(csv)`: parses and deduplicates stored work item IDs
- `useActiveProjectWorkItemIdsIndex()`: returns a `Record<projectId, string[]>` for active projects
- `useActiveProjectWorkItemIds(projectId)`: returns parsed work item IDs for one active project

Why this exists:

- Receipt line items can be assigned to other projects.
- When selecting a Cost Item for a receipt line item, the app may need Cost Items for a project other than the currently open route project.
- Loading another project's ProjectDetailsStore just to populate a picker is unnecessary overhead when the available Cost Item IDs can be cached in the project list store.

### 4) useWorkItemSpentUpdater

File: src/tbStores/projectDetails/ProjectDetailsStoreHooks.tsx

Responsibilities:

- Watches workItemCostEntries and workItemSummaries for a project.
- Filters entries to only those for the current project.
- Auto-creates missing workItemSummaries when a cost exists for an unknown work item.
- Aggregates spent by workItemId.
- Writes one full snapshot into WorkItemSpentSummaryContext.

### 5) useProjectWorkItemIdsUpdater

File: src/tbStores/projectDetails/ProjectDetailsStoreHooks.tsx

Responsibilities:

- Watches `workItemSummaries` for a project.
- Builds a deduplicated, deterministic CSV of `workItemId` values.
- Writes the CSV into `ListOfProjectsStore.projects.workItemIds`.
- Avoids redundant writes when the CSV has not changed.

This hook is part of the active-project background updater flow, so the list store stays current while active project detail stores are mounted.

## Provider and Lifecycle Placement

WorkItemSpentSummaryProvider is mounted in:

- src/app/(protected)/\_layout.tsx

This keeps spent data available to all protected screens and allows shared cache usage across project pages.

## Screen Consumption Patterns

### Receipt line item Cost Item pickers

Files:

- src/app/(protected)/(home)/[projectId]/receipt/[receiptId]/addLineItem.tsx
- src/app/(protected)/(home)/[projectId]/receipt/[receiptId]/[lineItemId]/index.tsx
- src/app/(protected)/(home)/[projectId]/receipt/[receiptId]/requestAIProcessing.tsx

Pattern:

- Each picker passes the selected project ID for the line item, falling back to the route project ID.
- `CostItemPicker` calls `useProjectWorkItems(projectId)`.
- `useProjectWorkItems` first tries the active-project Cost Item index from `ListOfProjectsStore`.
- If indexed IDs are unavailable, it falls back to reading `workItemSummaries` from that project's `ProjectDetailsStore`.

Benefit:

- Cross-project receipt line item assignment can show project-specific Cost Items immediately.
- Active-project picker lookups stay cheap.
- Existing picker APIs remain unchanged.

### Category cost breakdown screen

File:

- src/app/(protected)/(home)/[projectId]/costItems/[categoryId]/index.tsx

Pattern:

- Read project spent map once with getProjectWorkItemSpentAmounts(projectId).
- Lookup spentAmount by workItemId while building category summaries.

Benefit:

- Replaces repeated filter + reduce scans of cost entries with map lookups.

### Project summary screen

File:

- src/app/(protected)/(home)/[projectId]/index.tsx

Pattern:

- Same as category screen: use project spent map lookup per work item.

Benefit:

- Faster section aggregation when rendering bid, spent, balance, and completion totals.

### Cost item detail screen

File:

- src/app/(protected)/(home)/[projectId]/[costSummaryItemId]/index.tsx

Pattern:

- Read a single work item spent value with useWorkItemSpentValue(projectId, workItemId).

## Calculation Rules

- spentAmount for a work item is the sum of its workItemCostEntries amounts scoped to that project.
- balance for a work item is:
  - 0 when the summary item is marked complete
  - bidAmount - spentAmount when not complete
- completion total/profit includes only items marked complete:
  - sum of (bidAmount - spentAmount) for complete items
- `projects.workItemIds` is derived from `workItemSummaries.workItemId` values for that project.
- `projects.workItemIds` should contain unique, non-empty work item IDs only.
- For active projects, picker flows should prefer the list-store index before falling back to project-details reads.

## Maintenance Guidance

When changing cost calculation behavior:

1. Keep context reads cheap and deterministic.
2. Keep updater writes batched at the project level when possible.
3. Ensure deleted or unlinked cost entries cannot leave stale spent values in cache.
4. Preserve project scoping rules for cross-project cost entries.
5. Preserve synchronization between `workItemSummaries` and `projects.workItemIds`.
6. Validate all affected screens:
   - project summary
   - category summary
   - cost item details

- receipt line item Cost Item pickers

When adding new aggregate metrics:

1. Decide whether the metric should live in context (shared and read frequently).
2. If yes, update the updater hook to compute it once per project.
3. Expose a context getter that returns either a scalar or a snapshot map.
4. Avoid recomputing from raw entry arrays inside each screen render.

## Testing Checklist

For any cost-maintenance changes, validate:

- adding a cost entry updates spent and totals
- editing a cost entry amount updates spent and totals
- deleting a cost entry removes stale spent values
- adding a cost entry for a new work item auto-creates a summary row
- adding/removing project work item summaries updates `projects.workItemIds`
- active-project Cost Item pickers can resolve options without loading another project's ProjectDetailsStore
- cross-project receipt line items show Cost Items for the selected project, not only the route project
- completion toggles still affect balance and completion totals correctly
- category and project summary totals remain consistent with cost item details

## Known Tradeoffs

- Context currently uses React state and returns snapshot maps, which is simple but may still trigger broad consumer rerenders when data changes.
- If rerender pressure becomes noticeable, consider a selector or external-store subscription approach for finer-grained updates.
