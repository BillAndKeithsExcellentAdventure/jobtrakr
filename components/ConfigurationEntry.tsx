import { View, Text, useThemeColor } from '@/components/Themed';
import { Colors } from '@/constants/Colors';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import React, { useMemo } from 'react';
import { TouchableWithoutFeedback, Image, StyleSheet } from 'react-native';
import { useColorScheme } from './useColorScheme';

interface ConfigurationEntryProps {
  label: string;
  description: string;
  onPress: () => void;
}

export const ConfigurationEntry: React.FC<ConfigurationEntryProps> = ({ label, description, onPress }) => {
  const colorScheme = useColorScheme();
  const colors = useMemo(
    () =>
      colorScheme === 'dark'
        ? {
            borderColor: Colors.dark.borderColor,
            iconColor: Colors.dark.iconColor,
          }
        : {
            borderColor: Colors.light.borderColor,
            iconColor: Colors.light.iconColor,
          },
    [colorScheme],
  );

  return (
    <TouchableWithoutFeedback onPress={() => onPress()}>
      <View style={[styles.itemContainer, { borderColor: colors.borderColor }]}>
        <View style={styles.cfgContent}>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text txtSize="title" text={label} />
            <Text txtSize="xs" text={description} style={{ marginTop: 5 }} />
          </View>
          <View>
            <FontAwesome name="chevron-right" size={24} color={colors.iconColor} />
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
