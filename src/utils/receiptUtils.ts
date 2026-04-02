import { WorkItemCostEntry } from '@/src/tbStores/projectDetails/ProjectDetailsStoreHooks';

/**
 * Gathers all line items for a receipt from the current project's store.
 * For receipts synced to QuickBooks (with purchaseId), this includes both
 * current-project and cross-project line items.
 *
 * @param receiptId - The receipt ID
 * @param allCostItems - All cost items from the current project store
 * @returns Array of line items for this receipt, sorted by insertion order
 */
export function gatherLineItemsForReceipt(
  receiptId: string,
  allCostItems: WorkItemCostEntry[],
): WorkItemCostEntry[] {
  return allCostItems.filter((item) => item.parentId === receiptId && item.documentationType === 'receipt');
}

/**
 * Checks if a receipt has line items from multiple projects.
 *
 * @param lineItems - Array of line items
 * @param currentProjectId - The current project ID
 * @returns true if any line items have projectId different from currentProjectId
 */
export function hasMultiProjectLineItems(lineItems: WorkItemCostEntry[], currentProjectId: string): boolean {
  return lineItems.some((item) => item.projectId && item.projectId !== currentProjectId);
}

/**
 * Gets statistics about line items in a receipt.
 *
 * @param lineItems - Array of line items
 * @param currentProjectId - The current project ID
 * @returns Object with counts and IDs of line items by project
 */
export function getLineItemStatistics(
  lineItems: WorkItemCostEntry[],
  currentProjectId: string,
): {
  currentProjectCount: number;
  otherProjectCount: number;
  otherProjectIds: Set<string>;
  totalCount: number;
} {
  let currentProjectCount = 0;
  const otherProjectIds = new Set<string>();

  for (const item of lineItems) {
    if (!item.projectId || item.projectId === currentProjectId) {
      currentProjectCount++;
    } else {
      otherProjectIds.add(item.projectId);
    }
  }

  return {
    currentProjectCount,
    otherProjectCount: lineItems.length - currentProjectCount,
    otherProjectIds,
    totalCount: lineItems.length,
  };
}
