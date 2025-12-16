import { useUploadQueue } from '../hooks/useUploadQueue';

/**
 * Component that handles foreground upload processing for failed uploads.
 * This runs once every hour to retry failed uploads.
 * It processes all failed uploads without blocking the UI.
 */
export const UploadQueueProcessor = () => {
  useUploadQueue();

  // This component doesn't render anything
  return null;
};

export default UploadQueueProcessor;
