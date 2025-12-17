/**
 * Utility function to check if the app is running in development mode
 * @returns true if running in development mode, false otherwise
 */
export const isDevelopmentBuild = (): boolean => {
  return (global as any).__DEV__ === true;
};
