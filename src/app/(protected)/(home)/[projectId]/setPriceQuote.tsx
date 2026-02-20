import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { View, Text } from '@/src/components/Themed';
import { ModalScreenContainer } from '@/src/components/ModalScreenContainer';
import { NumberInputField } from '@/src/components/NumberInputField';
import { useFocusManager } from '@/src/hooks/useFocusManager';
import { useProject, useUpdateProjectCallback } from '@/src/tbStores/listOfProjects/ListOfProjectsStore';
import { useColors } from '@/src/context/ColorsContext';

export default function SetPriceQuoteModal() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const focusManager = useFocusManager();
  const project = useProject(projectId);
  const updateProject = useUpdateProjectCallback();
  const colors = useColors();
  const [priceQuote, setPriceQuote] = useState<number | null>();
  const router = useRouter();

  useEffect(() => {
    if (project) {
      setPriceQuote(project.quotedPrice);
    }
  }, [project]);

  const handleSave = () => {
    const newValue = focusManager.getFieldValue<number>('quotedPrice') ?? 0;
    updateProject(projectId, { quotedPrice: newValue });
    router.back();
  };

  const handleQuotedPriceChange = (value: number) => {
    setPriceQuote(value);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Initial Price Quote',
          headerShown: true,
        }}
      />
      <ModalScreenContainer title="Set Initial Quote" onSave={handleSave} onCancel={() => router.back()}>
        <View style={styles.container}>
          <NumberInputField
            label="Customer Quoted Price"
            focusManagerId="quotedPrice"
            style={{ ...styles.input, backgroundColor: colors.background, borderColor: colors.border }}
            labelStyle={{ backgroundColor: colors.background, marginBottom: 0 }}
            value={priceQuote ?? 0}
            onChange={(value) => handleQuotedPriceChange(value)}
            placeholder="Customer Quoted Price"
          />
        </View>
      </ModalScreenContainer>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
  },
});
