import React, { createContext, useContext, ReactNode, useState, useEffect, useRef } from 'react';
import { JobTrakrDB } from 'jobdb';
import { useSession } from './AuthSessionContext';

// Define the context and its types
interface DatabaseContextType {
  jobDbHost: JobTrakrDB | null;
}

// Create the context
const DatabaseContext = createContext<DatabaseContextType>({
  jobDbHost: null,
});

// Define the provider component
interface DatabaseHostProviderProps {
  children: ReactNode;
}

export const DatabaseHostProvider: React.FC<DatabaseHostProviderProps> = ({ children }) => {
  const [jobDbHost, setJobDbHost] = useState<JobTrakrDB | null>(null);
  const { sessionUser } = useSession();
  const replaceDatabase = useRef<boolean>(false); // set this to true to replace the database and then reset it to false

  useEffect(() => {
    async function initDb(userId: number) {
      console.info('Initializing DB...');
      const dbHost = new JobTrakrDB(userId);
      const createSampleDataIfEmpty = true;
      const status = await dbHost.OpenDatabase(createSampleDataIfEmpty, replaceDatabase.current);
      if (status === 'Success') {
        // Only replace the database once
        if (replaceDatabase.current) replaceDatabase.current = false;

        const db = dbHost.GetDb();
        console.info('DB Initialized. Opening...');
        setJobDbHost(dbHost);
        console.info('DB Initialized');
      } else {
        console.error(`Failed to initialize DB with status: ${status}`);
      }
    }

    if (sessionUser && sessionUser.userId > 0) initDb(sessionUser.userId);
  }, [sessionUser]);

  return <DatabaseContext.Provider value={{ jobDbHost: jobDbHost }}>{children}</DatabaseContext.Provider>;
};

// Define the custom hook to use the database
export const useJobDb = (): DatabaseContextType => {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useJobDb must be used within a DatabaseProvider');
  }
  return context;
};
