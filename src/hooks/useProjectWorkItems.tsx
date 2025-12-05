import { OptionEntry } from '@/src/components/OptionList';
import {
  useAllRows as useAllRowsConfiguration,
  WorkCategoryCodeCompareAsNumber,
  WorkItemDataCodeCompareAsNumber,
} from '@/src/tbStores/configurationStore/ConfigurationStoreHooks';
import { useAllRows } from '@/src/tbStores/projectDetails/ProjectDetailsStoreHooks';
import { useMemo } from 'react';

/**
 * Custom hook to get project-specific work items and related options
 * @param projectId - The project ID to filter work items for
 * @returns Object containing projectWorkItems, availableCategoriesOptions, allAvailableCostItemOptions, allWorkItems, and allWorkCategories
 */
export const useProjectWorkItems = (projectId: string) => {
  const allWorkItemCostSummaries = useAllRows(projectId, 'workItemSummaries');
  const allWorkItems = useAllRowsConfiguration('workItems', WorkItemDataCodeCompareAsNumber);
  const allWorkCategories = useAllRowsConfiguration('categories', WorkCategoryCodeCompareAsNumber);

  // Filter work items to only those available in this project
  const projectWorkItems = useMemo(() => {
    const uniqueWorkItemIds = allWorkItemCostSummaries.map((item) => item.workItemId);
    return allWorkItems.filter((item) => uniqueWorkItemIds.includes(item.id));
  }, [allWorkItemCostSummaries, allWorkItems]);

  const availableCategoriesOptions: OptionEntry[] = useMemo(() => {
    // get list of unique categoryIds from projectWorkItems
    const uniqueCategoryIds = projectWorkItems.map((item) => item.categoryId);

    // now get an array of OptionEntry for each entry in uniqueCategoryIds using allWorkCategories
    const uniqueCategories = allWorkCategories
      .filter((item) => uniqueCategoryIds.includes(item.id))
      .map((item) => ({
        label: item.name,
        value: item.id,
      }));
    return uniqueCategories;
  }, [projectWorkItems, allWorkCategories]);

  const allAvailableCostItemOptions: OptionEntry[] = useMemo(() => {
    const uniqueCostItems = projectWorkItems.map((item) => {
      const category = allWorkCategories.find((o) => o.id === item.categoryId);
      const categoryCode = category ? `${category.code}.` : '';
      return {
        sortValue1: Number.parseFloat(item.code),
        sortValue2: Number.parseFloat(category ? category.code : '0'),
        label: `${categoryCode}${item.code} - ${item.name}`,
        value: item.id,
      };
    });

    return uniqueCostItems
      .sort((a, b) => a.sortValue1 - b.sortValue1)
      .sort((a, b) => a.sortValue2 - b.sortValue2)
      .map((i) => ({ label: i.label, value: i.value }));
  }, [projectWorkItems, allWorkCategories]);

  return {
    projectWorkItems,
    availableCategoriesOptions,
    allAvailableCostItemOptions,
    allWorkItems,
    allWorkCategories,
  };
};
