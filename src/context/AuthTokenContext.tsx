import { useAuth } from '@clerk/clerk-expo';
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';

// Define the context type
type AuthTokenContextType = {
  token: string | null;
  isLoading: boolean;
  refreshToken: () => Promise<void>;
};

// Create the context with an initial undefined value
const AuthTokenContext = createContext<AuthTokenContextType | undefined>(undefined);

// Provider props type
type AuthTokenProviderProps = {
  children: ReactNode;
};

/**
 * AuthTokenProvider manages the Clerk authentication token in a centralized way.
 * It caches the token and automatically refreshes it when the auth state changes.
 * This prevents multiple redundant async calls to auth.getToken() throughout the app.
 */
export const AuthTokenProvider: React.FC<AuthTokenProviderProps> = ({ children }) => {
  const auth = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchToken = useCallback(async () => {
    try {
      setIsLoading(true);
      if (auth.userId && auth.isSignedIn) {
        const newToken = await auth.getToken();
        setToken(newToken ?? null);
      } else {
        setToken(null);
      }
    } catch (error) {
      console.error('Error fetching auth token:', error);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  }, [auth]);

  // Fetch token whenever auth state changes
  useEffect(() => {
    fetchToken();
  }, [fetchToken]);

  const refreshToken = useCallback(async () => {
    await fetchToken();
  }, [fetchToken]);

  return (
    <AuthTokenContext.Provider value={{ token, isLoading, refreshToken }}>
      {children}
    </AuthTokenContext.Provider>
  );
};

/**
 * Hook to access the cached authentication token.
 * This hook provides synchronous access to the token without requiring async calls.
 * The token is automatically kept up-to-date by the AuthTokenProvider.
 *
 * @returns {AuthTokenContextType} Object containing:
 *   - token: The current JWT token (or null if not authenticated)
 *   - isLoading: Whether the token is currently being fetched
 *   - refreshToken: Function to manually refresh the token
 *
 * @example
 * const { token, isLoading } = useAuthToken();
 * if (!isLoading && token) {
 *   // Use token for API calls
 * }
 */
export const useAuthToken = (): AuthTokenContextType => {
  const context = useContext(AuthTokenContext);
  if (!context) {
    throw new Error('useAuthToken must be used within an AuthTokenProvider');
  }
  return context;
};
