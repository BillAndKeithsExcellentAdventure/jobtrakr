import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import ReceiptQueueStore from '@/src/tbStores/ReceiptQueueStore';
import {
  useAddReceiptQueueEntryCallback,
  useAllReceiptQueueEntries,
} from '@/src/tbStores/ReceiptQueueStoreHooks';

jest.mock('@clerk/clerk-expo', () => ({
  useAuth: () => ({
    orgId: 'org-test',
  }),
}));

jest.mock('../../src/tbStores/persistence/useCreateClientPersisterAndStart', () => ({
  useCreateClientPersisterAndStart: () => {},
}));

jest.mock('../../src/tbStores/synchronization/useCreateServerSynchronizerAndStart', () => ({
  useCreateServerSynchronizerAndStart: () => {},
}));

describe('ReceiptQueueStore', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <>
      <ReceiptQueueStore />
      {children}
    </>
  );

  it('initializes and allows adding queue entries', async () => {
    const { result } = renderHook(
      () => ({
        addEntry: useAddReceiptQueueEntryCallback(),
        entries: useAllReceiptQueueEntries(),
      }),
      { wrapper },
    );

    expect(result.current.entries).toHaveLength(0);

    act(() => {
      result.current.addEntry({
        purchaseId: 'purchase-1',
        fromProjectId: 'project-a',
        vendorRef: 'vendor-1',
        imageId: 'image-1',
        lineItems: [
          { itemDescription: 'Lumber', amount: 125.5, projectId: 'project-b', workItemId: 'workItem-1' },
        ],
      });
    });

    await waitFor(() => {
      expect(result.current.entries).toHaveLength(1);
    });

    expect(result.current.entries[0].purchaseId).toBe('purchase-1');
    expect(result.current.entries[0].fromProjectId).toBe('project-a');
    expect(result.current.entries[0].vendorRef).toBe('vendor-1');
    expect(result.current.entries[0].imageId).toBe('image-1');
    expect(result.current.entries[0].lineItems).toEqual([
      { itemDescription: 'Lumber', amount: 125.5, projectId: 'project-b', workItemId: 'workItem-1' },
    ]);
  });
});
