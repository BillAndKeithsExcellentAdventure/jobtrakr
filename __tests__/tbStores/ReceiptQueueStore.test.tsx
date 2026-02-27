import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import ReceiptQueueStore from '@/src/tbStores/ReceiptQueueStore';
import {
  useAddReceiptQueueEntryCallback,
  useAllReceiptQueueEntries,
} from '@/src/tbStores/ReceiptQueueStoreHooks';
import { Provider } from 'tinybase/ui-react';

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
    <Provider>
      <ReceiptQueueStore />
      {children}
    </Provider>
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
        vendorId: 'vendor-1',
        vendor: 'Acme Supply Co.',
        paymentAccountId: 'account-1',
        accountingId: '',
        qbSyncHash: '',
        description: 'Building materials',
        receiptDate: 1700000000000,
        pictureDate: 1700000001000,
        thumbnail: 'thumb-data',
        notes: 'Test receipt notes',
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
    expect(result.current.entries[0].vendorId).toBe('vendor-1');
    expect(result.current.entries[0].vendor).toBe('Acme Supply Co.');
    expect(result.current.entries[0].paymentAccountId).toBe('account-1');
    expect(result.current.entries[0].description).toBe('Building materials');
    expect(result.current.entries[0].receiptDate).toBe(1700000000000);
    expect(result.current.entries[0].pictureDate).toBe(1700000001000);
    expect(result.current.entries[0].thumbnail).toBe('thumb-data');
    expect(result.current.entries[0].notes).toBe('Test receipt notes');
    expect(result.current.entries[0].imageId).toBe('image-1');
    expect(result.current.entries[0].lineItems).toEqual([
      { itemDescription: 'Lumber', amount: 125.5, projectId: 'project-b', workItemId: 'workItem-1' },
    ]);
  });
});
