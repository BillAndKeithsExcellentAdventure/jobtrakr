import * as React from 'react';
import { Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { useSignUp, useClerk, useAuth } from '@clerk/clerk-expo';
import { Link, Redirect, useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useEffect } from 'react';

export default function InviteUser() {
  const colorScheme = useColorScheme();
  const colors = React.useMemo(
    () =>
      colorScheme === 'dark'
        ? {
            listBackground: Colors.dark.listBackground,
            borderColor: Colors.dark.borderColor,
            iconColor: Colors.dark.iconColor,
            textColor: Colors.dark.text,
          }
        : {
            listBackground: Colors.light.listBackground,
            borderColor: Colors.light.borderColor,
            iconColor: Colors.light.iconColor,
            textColor: Colors.light.text,
          },
    [colorScheme],
  );

  return (
    <View>
      <>
        <Text style={{ ...styles.input, color: colors.textColor }}>Invite User</Text>
      </>
    </View>
  );
}

const styles = {
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  button: {
    backgroundColor: '#000',
    padding: 15,
    borderRadius: 5,
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  link: {
    color: '#007AFF',
  },
} as const;
