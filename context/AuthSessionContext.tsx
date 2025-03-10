import { useContext, createContext, type PropsWithChildren, useEffect, useState, useMemo } from 'react';
import { useStorageState } from './useStorageState';

const sessionKey = 'session';

export interface SessionUser {
  userId: number;
  name: string;
  email: string;
}

const AuthSessionContext = createContext<{
  signIn: () => void;
  signOut: () => void;
  sessionUser: SessionUser | undefined;
}>({
  signIn: () => null,
  signOut: () => null,
  sessionUser: undefined,
});

// This hook can be used to access the user info.
export function useAuthSession() {
  const value = useContext(AuthSessionContext);
  if (process.env.NODE_ENV !== 'production') {
    if (!value) {
      throw new Error('useSession must be wrapped in a <SessionProvider />');
    }
  }

  return value;
}

export function SessionProvider({ children }: PropsWithChildren) {
  const [sessionData, setSessionData] = useState<string | undefined>(undefined);
  const [sessionUser, setSessionUser] = useState<SessionUser | undefined>(undefined);

  useEffect(() => {
    const user = { userId: 1, name: 'Nick', email: 'nick@bertrambuilders.com' };
    setSessionData(JSON.stringify(user));
  }, []);

  useEffect(() => {
    try {
      const parsedUser: SessionUser | null = sessionData ? JSON.parse(sessionData) : undefined;
      if (parsedUser) setSessionUser(parsedUser);
      else setSessionUser(undefined);
    } catch {
      setSessionUser(undefined);
    }
  }, [sessionData]);

  const authValue = useMemo(() => {
    return {
      signIn: () => {
        // Perform sign-in logic here
        console.log('Signing in');
        const sessionUser: SessionUser = { userId: 1, name: 'Nick', email: 'nick@bertrambuilders.com' };
        setSessionUser(sessionUser);
        setSessionData(JSON.stringify(sessionUser));
      },
      signOut: () => {
        console.log('Signing out');
        setSessionUser(undefined);
      },
      sessionUser,
    };
  }, [sessionUser]);

  return <AuthSessionContext.Provider value={authValue}>{children}</AuthSessionContext.Provider>;
}
