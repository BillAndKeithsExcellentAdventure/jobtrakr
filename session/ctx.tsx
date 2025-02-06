import { useContext, createContext, type PropsWithChildren, useMemo } from 'react';
import { useStorageState } from './useStorageState';

export interface SessionUser {
  userId: number;
  name: string;
  email: string;
}

const AuthContext = createContext<{
  signIn: () => void;
  signOut: () => void;
  session?: string | null;
  isLoading: boolean;
  sessionUser: SessionUser | null;
}>({
  signIn: () => null,
  signOut: () => null,
  session: null,
  isLoading: false,
  sessionUser: null,
});

// This hook can be used to access the user info.
export function useSession() {
  const value = useContext(AuthContext);
  if (process.env.NODE_ENV !== 'production') {
    if (!value) {
      throw new Error('useSession must be wrapped in a <SessionProvider />');
    }
  }

  return value;
}

export function SessionProvider({ children }: PropsWithChildren) {
  const [[isLoading, session], setSession] = useStorageState('session');
  const sessionUser = useMemo<SessionUser | null>(() => {
    try {
      const user = session ? JSON.parse(session) : null;
      return user;
    } catch {
      return null;
    }
  }, [session]);

  return (
    <AuthContext.Provider
      value={{
        signIn: () => {
          // Perform sign-in logic here
          console.log('Signing in');
          const sessionUser: SessionUser = { userId: 1, name: 'Nick', email: 'nick@bertrambuilders.com' };
          setSession(JSON.stringify(sessionUser));
        },
        signOut: () => {
          console.log('Signing out');
          setSession(null);
        },
        session,
        isLoading,
        sessionUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
