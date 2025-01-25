import { View, Text, StyleSheet } from 'react-native';
import React from 'react';
import { useLocalSearchParams, Stack } from 'expo-router';

const ItemPage = () => {
  const { jobId, category, itemId } = useLocalSearchParams<{ itemId: string; category: string; jobId: string }>();

  return (
    <View>
      <Stack.Screen options={{ headerShown: true, title: `(${jobId}) / (${category})  Details` }} />

      <Text>{`ItemPage category ${category} - job ${jobId}`}</Text>
    </View>
  );
};

export default ItemPage;
