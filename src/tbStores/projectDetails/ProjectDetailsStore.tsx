import { useEffect, useRef } from 'react';
import * as UiReact from 'tinybase/ui-react/with-schemas';
import { createMergeableStore, NoValuesSchema } from 'tinybase/with-schemas';
import { useStore } from 'tinybase/ui-react';
import { useCreateClientPersisterAndStart } from '../persistence/useCreateClientPersisterAndStart';
import { useCreateServerSynchronizerAndStart } from '../synchronization/useCreateServerSynchronizerAndStart';
import { useProjectDetailsStoreCache } from '../../context/ProjectDetailsStoreCacheContext';
import { useAuth } from '@clerk/clerk-expo';
import { useProjectListStoreId } from '../listOfProjects/ListOfProjectsStore';
import {
  doesProjectExistInQuickBooks,
  addProjectToQuickBooks,
  updateProjectInQuickBooks,
} from '../../utils/quickbooksAPI';

const STORE_ID_PREFIX = 'projectDetailsStore-';

export const TABLES_SCHEMA = {
  workItemSummaries: {
    id: { type: 'string' },
    workItemId: { type: 'string' },
    bidAmount: { type: 'number' },
    complete: { type: 'boolean' },
    bidNote: { type: 'string' },
  },

  receipts: {
    id: { type: 'string' },
    accountingId: { type: 'string' }, // Receipt ID like 'RECEIPT_PROJABBR_12345'
    vendor: { type: 'string' },
    vendorId: { type: 'string' }, // QuickBooks Vendor ID
    paymentAccountId: { type: 'string' }, // QuickBooks Account ID
    expenseAccountId: { type: 'string' }, // QuickBooks Expense Account ID
    description: { type: 'string' },
    amount: { type: 'number' }, // Total Amount
    receiptDate: { type: 'number' }, // Date on the receipt.
    thumbnail: { type: 'string' },
    pictureDate: { type: 'number' }, // Date the picture was taken.
    imageId: { type: 'string' },
    notes: { type: 'string' }, // not currently in ui
    markedComplete: { type: 'boolean' },
    purchaseId: { type: 'string' }, // QuickBooks Purchase ID
    qbSyncHash: { type: 'string' },
  },

  invoices: {
    id: { type: 'string' },
    accountingId: { type: 'string' },
    vendorId: { type: 'string' }, // QuickBooks Vendor ID
    paymentStatus: { type: 'string' }, // 'pending' | 'paid'
    description: { type: 'string' },
    amount: { type: 'number' }, // Total Amount
    invoiceDate: { type: 'number' }, // Date on the invoice.
    invoiceNumber: { type: 'string' }, // Vendor's invoice number
    thumbnail: { type: 'string' },
    pictureDate: { type: 'number' }, // Date the picture was taken.
    imageId: { type: 'string' },
    notes: { type: 'string' }, // currently used for check number
    markedComplete: { type: 'boolean' },
    billId: { type: 'string' }, // QuickBooks Bill ID
    qbSyncHash: { type: 'string' },
  },

  workItemCostEntries: {
    id: { type: 'string' },
    label: { type: 'string' },
    amount: { type: 'number' },
    workItemId: { type: 'string' },
    parentId: { type: 'string' }, // ReceiptId or InvoiceId
    documentationType: { type: 'string' }, // 'receipt' or 'invoice'
    projectId: { type: 'string' }, // Project ID - this is needed if cost entry is associated with another project
  },

  mediaEntries: {
    id: { type: 'string' },
    assetId: { type: 'string' }, // only used when media is on local device
    deviceName: { type: 'string' }, // only used when media is on local device
    imageId: { type: 'string' }, // the id of the image as stored in the uri.
    mediaType: { type: 'string' }, // 'video' or 'photo'
    thumbnail: { type: 'string' }, // thumbnail image.
    creationDate: { type: 'number' }, // Date the picture was taken.
    isPublic: { type: 'boolean' },
  },

  notes: {
    id: { type: 'string' },
    task: { type: 'string' },
    completed: { type: 'boolean' },
  },

  changeOrders: {
    id: { type: 'string' },
    title: { type: 'string' },
    description: { type: 'string' },
    bidAmount: { type: 'number' },
    quotedPrice: { type: 'number' },
    status: { type: 'string' }, // 'draft' | 'approval-pending' | 'approved' | 'cancelled';
    dateCreated: { type: 'number' }, // Date the change order was created.
    accountingId: { type: 'string' }, // ID returned from backend after sending email
  },

  changeOrderItems: {
    id: { type: 'string' },
    changeOrderId: { type: 'string' },
    label: { type: 'string' },
    amount: { type: 'number' },
    workItemId: { type: 'string' },
  },
} as const;

const { useCreateMergeableStore, useProvideStore } = UiReact as UiReact.WithSchemas<
  [typeof TABLES_SCHEMA, NoValuesSchema]
>;

export const getStoreId = (projId: string) => STORE_ID_PREFIX + projId;

// Create, persist, and sync a store containing the project and its categories.
export default function ProjectDetailsStore({ projectId }: { projectId: string }) {
  const { addStoreToCache, removeStoreFromCache } = useProjectDetailsStoreCache();
  const { orgId, userId, getToken } = useAuth();
  const listStoreId = useProjectListStoreId();
  const listStore = useStore(listStoreId);
  const updateQbTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const storeId = getStoreId(projectId);
  const store = useCreateMergeableStore(() => createMergeableStore().setTablesSchema(TABLES_SCHEMA));

  useCreateClientPersisterAndStart(storeId, store);
  useCreateServerSynchronizerAndStart(storeId, store);
  useProvideStore(storeId, store);

  // Add store to cache and sync with QuickBooks when it's created
  useEffect(() => {
    if (store) {
      let isMounted = true;
      console.log('Mounting ProjectDetailsStore for projectId:', projectId);
      addStoreToCache(projectId, store);

      if (orgId && userId) {
        const syncWithQuickBooks = async () => {
          try {
            const project = listStore?.getRow('projects', projectId);
            const projectName = (project?.name as string) ?? '';
            const customerId = (project?.customerId as string) ?? '';

            const exists = await doesProjectExistInQuickBooks(orgId, projectId, userId, getToken);
            if (isMounted && !exists) {
              await addProjectToQuickBooks(orgId, userId, { customerId, projectName, projectId }, getToken);
            }
          } catch (error) {
            if (isMounted) {
              console.error('ProjectDetailsStore: Failed to sync project with QuickBooks:', error);
            }
          }
        };
        syncWithQuickBooks();
      }

      return () => {
        isMounted = false;
        console.log('Unmounting ProjectDetailsStore for projectId:', projectId);
        removeStoreFromCache(projectId);
      };
    }
  }, [projectId, store, addStoreToCache, removeStoreFromCache, orgId, userId, getToken, listStore]);

  // Listen for customerId changes and update QuickBooks (debounced to avoid rapid-fire requests)
  useEffect(() => {
    if (!listStore || !orgId || !userId) return;

    const listenerId = listStore.addCellListener(
      'projects',
      projectId,
      'customerId',
      (_store, _tableId, _rowId, _cellId, newCustomerId) => {
        if (updateQbTimerRef.current) {
          clearTimeout(updateQbTimerRef.current);
        }
        updateQbTimerRef.current = setTimeout(async () => {
          const project = listStore.getRow('projects', projectId);
          const projectName = (project?.name as string) ?? '';

          try {
            await updateProjectInQuickBooks(
              orgId,
              userId,
              { customerId: newCustomerId as string, projectName, projectId },
              getToken,
            );
          } catch (error) {
            console.error('ProjectDetailsStore: Failed to update project in QuickBooks:', error);
          }
        }, 500);
      },
    );

    return () => {
      if (updateQbTimerRef.current) {
        clearTimeout(updateQbTimerRef.current);
      }
      listStore.delListener(listenerId);
    };
  }, [projectId, listStore, orgId, userId, getToken]);

  return null;
}
