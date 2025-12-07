/**
 * Configuration for the synchronization server.
 * This should eventually be loaded from environment variables.
 */

// TODO: Figure out how to get this from an env.
export const SYNC_SERVER_URL = 'wss://projecthoundserver.keith-m-bertram.workers.dev/';

if (!SYNC_SERVER_URL) {
  throw new Error('Please set EXPO_PUBLIC_SYNC_SERVER_URL in .env to the URL of the sync server');
}
