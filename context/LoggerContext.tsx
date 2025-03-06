import { DBLogger } from 'jobdb';
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useAuthSession } from './AuthSessionContext';

// Define the context and its types
interface LoggerContextType {
  shareLogFile: () => void;
  removeOld: (numDays: number) => void;
  logError: (msg: string) => void;
  logInfo: (msg: string) => void;
  logWarn: (msg: string) => void;
}

// Create the context
const LoggerContext = createContext<LoggerContextType>({
  shareLogFile: () => null,
  removeOld: (numDays: number) => null,
  logError: (msg: string) => null,
  logInfo: (msg: string) => null,
  logWarn: (msg: string) => null,
});

// Define the provider component
interface LoggerHostProviderProps {
  children: ReactNode;
}

export const LoggerHostProvider: React.FC<LoggerHostProviderProps> = ({ children }) => {
  const dbLoggerRef = useRef<DBLogger | null>(null); // Add this line

  // DO NOT REMOVE. Using the setDBLoggerHost function after the dbHost below is initialized will prevent
  //                it from being garbage collected.
  const [dbLoggerHost, setDbLoggerHost] = useState<DBLogger | null>(null);
  const { sessionUser } = useAuthSession();
  const replaceDatabase = useRef<boolean>(false);

  // Update the initialization effect
  useEffect(() => {
    async function initDb() {
      console.info('Initializing Logging DB...');
      const dbHost = new DBLogger();
      const status = await dbHost.OpenDatabase(replaceDatabase.current);
      if (status === 'Success') {
        if (replaceDatabase.current) replaceDatabase.current = false;
        console.info(`DBLogger Initialized. File: ${dbHost.GetLogFileName()}`);
        dbLoggerRef.current = dbHost; // Store in ref
        setDbLoggerHost(dbHost);

        await dbHost.RemoveOld(3);
      } else {
        console.error(`Failed to initialize DBLogger: ${status}`);
        dbLoggerRef.current = null;
      }
    }

    if (sessionUser && sessionUser.userId > 0) {
      console.info('Initializing DB for user:', sessionUser.userId);
      initDb();
    }

    // Cleanup function
    return () => {
      console.info('Cleaning up DBLogger...');
      if (dbLoggerRef.current) {
        console.info('Closing logger connection...');
        dbLoggerRef.current = null;
      }
    };
  }, [sessionUser]);

  // Modified share function
  const handleShareLogFile = useCallback(async () => {
    console.info('Starting handleShareLogFile...');
    console.info('Current dbLoggerHost:', dbLoggerRef.current?.GetLogFileName());

    const logger = dbLoggerRef.current;
    if (!logger) {
      console.error('DBLogger is null or undefined');
      return;
    }

    try {
      console.info(`Attempting to share log file: ${logger.GetLogFileName()}`);
      await logger.Share();
      console.info('Log file shared successfully');
    } catch (error) {
      console.error('Error sharing log file:', error);
    }
  }, []); // Remove dbLoggerHost dependency since we're using ref

  const handleRemoveOld = useCallback(async (numDays: number) => {
    console.info('Starting removeOld...');

    const logger = dbLoggerRef.current;
    if (!logger) {
      console.error('DBLogger is null or undefined');
      return;
    }

    try {
      await logger.RemoveOld(numDays);
    } catch (error) {
      console.error('Error removing old log entries:', error);
    }
  }, []); // Remove dbLoggerHost dependency since we're using ref

  // Modified provider value
  const contextValue = useMemo(
    () => ({
      shareLogFile: handleShareLogFile,
      removeOld: (numDays: number) => handleRemoveOld(numDays),
      logError: (msg: string) => {
        console.error('logError', msg);
        dbLoggerRef.current?.InsertLog('Error', msg);
      },
      logInfo: (msg: string) => {
        console.info('logInfo', msg);
        dbLoggerRef.current?.InsertLog('Info', msg);
      },
      logWarn: (msg: string) => {
        console.warn('logWarn', msg);
        dbLoggerRef.current?.InsertLog('Warn', msg);
      },
    }),
    [handleShareLogFile],
  );

  return <LoggerContext.Provider value={contextValue}>{children}</LoggerContext.Provider>;
};

// Define the custom hook to use the database
export const useDbLogger = (): LoggerContextType => {
  const context = useContext(LoggerContext);
  if (!context) {
    throw new Error('useDbLogger must be used within a LoggerProvider');
  }
  return context;
};
