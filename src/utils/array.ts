export function createItemsArray<T>(activeItems: T[], modifyItems: T[], action: 'include' | 'exclude'): T[] {
  switch (action) {
    case 'include':
      // Include items from modifyItems that are not already in activeItems
      return [...new Set([...activeItems, ...modifyItems])];

    case 'exclude':
      // Exclude items from modifyItems that are in activeItems
      return activeItems.filter((item) => !modifyItems.includes(item));

    default:
      throw new Error('Invalid action type');
  }
}
