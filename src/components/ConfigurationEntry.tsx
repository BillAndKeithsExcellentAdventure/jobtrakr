import { Text, View } from '@/src/components/Themed';
import { useColors } from '@/src/context/ColorsContext';
import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableWithoutFeedback } from 'react-native';

interface ConfigurationEntryProps {
  label: string;
  description: string;
  onPress: () => void;
}

export const ConfigurationEntry: React.FC<ConfigurationEntryProps> = ({ label, description, onPress }) => {
  const colors = useColors();

  return (
    <TouchableWithoutFeedback onPress={() => onPress()}>
      <View style={[styles.itemContainer, { borderColor: colors.border }]}>
        <View style={styles.cfgContent}>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text txtSize="title" text={label} />
            <Text txtSize="xs" text={description} style={{ marginTop: 5 }} />
          </View>
          <View>
            <MaterialIcons name="chevron-right" size={32} color={colors.iconColor} />
          </View>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

export const styles = StyleSheet.create({
  cfgContent: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    padding: 8,
    borderRadius: 8,
  },
  itemContainer: {
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 15,
    elevation: 20, // Adds shadow effect for Android
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    padding: 10,
  },
});
