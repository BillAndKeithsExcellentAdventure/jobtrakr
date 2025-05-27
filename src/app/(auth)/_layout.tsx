import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';

const AuthLayout = () => {
  const { isSignedIn, orgId } = useAuth();

  if (isSignedIn && orgId) {
    return <Redirect href={'/'} />;
  }

  return <Stack />;
};

export default AuthLayout;
