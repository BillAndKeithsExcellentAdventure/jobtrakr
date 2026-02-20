import { useReceiptQueue } from '../hooks/useReceiptQueue';

/**
 * ReceiptQueueProcessor
 *
 * This component enables receipt queue processing by calling the useReceiptQueue hook.
 * It should be placed in the root layout so it runs for the entire app lifecycle.
 *
 * The component itself renders nothing (returns null), but the hook it calls
 * processes queued receipt entries in the background, copying them to target
 * projects as identified by line item projectIds.
 *
 */
export const ReceiptQueueProcessor = () => {
  useReceiptQueue();
  return null;
};
