import { Text, View } from '@/components/Themed';
import { useColors } from '@/context/ColorsContext';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { StyleSheet } from 'react-native';

const EditLineItemPage = () => {
  const { projectId, receiptId, lineItemId } = useLocalSearchParams<{
    projectId: string;
    receiptId: string;
    lineItemId: string;
  }>();

  const colors = useColors();

  return (
    <View>
      <Text>EditLineItemPage</Text>
    </View>
  );
};

export default EditLineItemPage;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    flex: 1,
    width: '100%',
  },
});
