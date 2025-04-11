import { useContext, createContext, type PropsWithChildren, useEffect, useState, useMemo } from 'react';
import { useStorageState } from './useStorageState';
import { useAuth, useUser } from '@clerk/clerk-expo';

const sessionKey = 'session';

export interface SessionUser {
  userId: string;
  orgId: string;
  name: string;
  email: string;
}

const AuthSessionContext = createContext<{
  signIn: () => void;
  signOut: () => void;
  sessionUser: SessionUser | undefined;
}>({
  signIn: () => null,
  signOut: () => {
    console.log('In signout');
  },
  sessionUser: undefined,
});

// This hook can be used to access the user info.
export function useAuthSession() {
  if (process.env.NODE_ENV !== 'production') {
    //  throw new Error('useSession must be wrapped in a <SessionProvider />');
  }

  const value = useContext(AuthSessionContext);

  return value;
}

export function SessionProvider({ children }: PropsWithChildren) {
  const [sessionData, setSessionData] = useState<string | undefined>(undefined);
  const [sessionUser, setSessionUser] = useState<SessionUser | undefined>(undefined);
  const { isLoaded, isSignedIn, userId, orgId, sessionId, getToken } = useAuth();
  const { user } = useUser();

  // useEffect(() => {
  //   const user = { userId: 1, name: 'Nick', email: 'nick@bertrambuilders.com' };
  //   setSessionData(JSON.stringify(user));
  // }, []);

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
        const value = useContext(AuthSessionContext);
        if (value) {
          // Perform sign-in logic here
          console.log('Signing in');
          value.sessionUser = new Object() as SessionUser;
          value.sessionUser.userId = userId ? userId : '';
          value.sessionUser.orgId = orgId ? orgId : '';
          value.sessionUser.name = user?.fullName ? user?.fullName : '';
          value.sessionUser.email = user?.emailAddresses[0]?.emailAddress
            ? user?.emailAddresses[0]?.emailAddress
            : '';

          console.log('useAuthSession: ', value.sessionUser);
        }
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
