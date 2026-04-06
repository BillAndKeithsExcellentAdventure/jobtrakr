import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useSeedWorkItemsIfNecessary } from '@/src/tbStores/projectDetails/ProjectDetailsStoreHooks';

let mockSeedStateSetterSpy: jest.Mock;
let mockSeedWorkItems = 'work-1, work-2';

jest.mock('tinybase/ui-react/with-schemas', () => ({
  useStore: jest.fn(() => null),
  useCell: jest.fn(),
}));

jest.mock('expo-crypto', () => {
  let next = 0;
  return {
    randomUUID: jest.fn(() => {
      next += 1;
      return `seed-row-${next}`;
    }),
  };
});

jest.mock('@/src/models/types', () => ({}));

jest.mock('@/src/tbStores/listOfProjects/ListOfProjectsStore', () => ({
  useProjectValue: () => {
    const wrappedSetter = (nextValue: string) => {
      mockSeedStateSetterSpy(nextValue);
      mockSeedWorkItems = nextValue;
    };
    return [mockSeedWorkItems, wrappedSetter];
  },
}));

const mockGetStoreFromCache = jest.fn();
const mockSubscribeToStoreReady = jest.fn();

jest.mock('@/src/context/ProjectDetailsStoreCacheContext', () => ({
  useProjectDetailsStoreCache: () => ({
    getStoreFromCache: mockGetStoreFromCache,
    subscribeToStoreReady: mockSubscribeToStoreReady,
  }),
}));

describe('useSeedWorkItemsIfNecessary', () => {
  beforeEach(() => {
    mockSeedStateSetterSpy = jest.fn();
    mockSeedWorkItems = 'work-1, work-2';
    mockGetStoreFromCache.mockReset();
    mockSubscribeToStoreReady.mockReset();
  });

  it('seeds once when the project store becomes ready after initial render', async () => {
    let cachedStore: any = null;
    const storeReadyCallbacks = new Set<() => void>();

    const setRow = jest.fn();
    const transaction = jest.fn((callback: () => void) => callback());

    mockGetStoreFromCache.mockImplementation(() => cachedStore);
    mockSubscribeToStoreReady.mockImplementation((_projectId: string, callback: () => void) => {
      storeReadyCallbacks.add(callback);
      return () => {
        storeReadyCallbacks.delete(callback);
      };
    });

    const { rerender } = renderHook(() => useSeedWorkItemsIfNecessary('project-1'));

    expect(setRow).toHaveBeenCalledTimes(0);
    expect(mockSeedStateSetterSpy).toHaveBeenCalledTimes(0);
    expect(mockSubscribeToStoreReady).toHaveBeenCalled();

    act(() => {
      cachedStore = { transaction, setRow };
      for (const callback of Array.from(storeReadyCallbacks)) {
        callback();
      }
    });

    await waitFor(() => {
      expect(transaction).toHaveBeenCalledTimes(1);
      expect(setRow).toHaveBeenCalledTimes(2);
    });

    expect(setRow).toHaveBeenNthCalledWith(1, 'workItemSummaries', 'seed-row-1', {
      id: 'seed-row-1',
      workItemId: 'work-1',
      bidAmount: 0,
      complete: false,
    });
    expect(setRow).toHaveBeenNthCalledWith(2, 'workItemSummaries', 'seed-row-2', {
      id: 'seed-row-2',
      workItemId: 'work-2',
      bidAmount: 0,
      complete: false,
    });
    expect(mockSeedStateSetterSpy).toHaveBeenCalledWith('');

    rerender();

    act(() => {
      for (const callback of Array.from(storeReadyCallbacks)) {
        callback();
      }
    });

    expect(setRow).toHaveBeenCalledTimes(2);
  });
});
