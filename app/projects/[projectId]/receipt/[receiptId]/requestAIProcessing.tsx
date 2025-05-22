import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, View } from '@/components/Themed';
import { useAuth } from '@clerk/clerk-expo';

const processAIProcessing = async (
  token: string,
  imageId: string,
  projectId: string,
  userId: string,
  organizationId: string,
) => {
  try {
    const receiptImageData = {
      imageId: imageId,
      projectId: projectId,
      userId: userId,
      organizationId: organizationId,
    };
    console.log(' token:', token);
    console.log(' receiptImageData:', receiptImageData);
    const response = await fetch(
      'https://projecthoundbackend.keith-m-bertram.workers.dev/getReceiptIntelligence',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(receiptImageData),
      },
    );

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Error response:', errorBody);
      throw new Error(`HTTP error! status: ${response.status}. Response: ${errorBody}`);
    }

    const data = await response.json();
    console.log(' response.ok?:', response.ok);
    console.log(' response:', JSON.stringify(data));

    return data;
  } catch (error) {
    console.error('Error processing receipt:', error);
    throw error;
  }
};

const requestAIProcessingPage = () => {
  const { projectId, imageId } = useLocalSearchParams<{ projectId: string; imageId: string }>();
  const auth = useAuth();
  const { userId, orgId } = auth;
  const [resultJson, setResultJson] = useState<any>(null);

  useEffect(() => {
    async function fetchAIResult() {
      const token = await auth.getToken();
      if (!token) {
        console.error('No token available');
        return;
      }

      const result = await processAIProcessing(token, imageId, projectId, userId!, orgId!);
      setResultJson(result);
    }

    fetchAIResult();
  }, []);

  return (
    <SafeAreaView edges={['right', 'bottom', 'left']} style={{ flex: 1 }}>
      <View style={styles.container}>
        <Text>Request AI Processing</Text>
        <Text>{JSON.stringify(resultJson)}</Text>
      </View>
    </SafeAreaView>
  );
};

export default requestAIProcessingPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
});
