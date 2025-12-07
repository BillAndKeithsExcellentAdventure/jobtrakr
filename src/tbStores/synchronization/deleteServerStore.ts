/**
 * Sends a deletion request to the Cloudflare Durable Object server to remove
 * the stored data for a specific store.
 * 
 * This function attempts to signal the server to delete the persistent data
 * associated with a project store. The server should handle this by clearing
 * the Durable Object storage for the given storeId.
 * 
 * Note: This requires server-side implementation to handle the DELETE request.
 * 
 * @param storeId - The ID of the store to delete on the server
 * @returns A promise that resolves when the deletion request completes
 */
export const deleteServerStore = async (storeId: string): Promise<void> => {
  const SYNC_SERVER_URL = 'wss://projecthoundserver.keith-m-bertram.workers.dev/';
  
  try {
    // Convert WebSocket URL to HTTP(S) URL for the deletion request
    const httpUrl = SYNC_SERVER_URL.replace('wss://', 'https://').replace('ws://', 'http://');
    const deleteUrl = `${httpUrl}${storeId}`;
    
    console.log(`Sending deletion request to server for storeId: ${storeId}`);
    
    const response = await fetch(deleteUrl, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      console.log(`Successfully requested deletion of server store: ${storeId}`);
    } else {
      console.warn(`Server deletion request returned status ${response.status} for ${storeId}`);
    }
  } catch (error) {
    console.error(`Error requesting server deletion for ${storeId}:`, error);
    // Don't throw - we want local cleanup to succeed even if server deletion fails
  }
};
