import { useMemo, useState } from 'react';
import { StyleSheet, FlatList, Platform, Pressable, TextStyle, StyleProp } from 'react-native';
import { Text, View } from '@/components/Themed';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from './useColorScheme';

// Define types for the props
export interface OptionEntry {
  label: string;
  value?: any;
}

type Props = {
  options: OptionEntry[];
  onSelect: (option: OptionEntry) => void;
  textStyle?: StyleProp<TextStyle>;
};

export default function OptionList({ options, onSelect, textStyle }: Props) {
  const colorScheme = useColorScheme();

  const colors = useMemo(
    () =>
      colorScheme === 'dark'
        ? {
            background: Colors.dark.background,
            separatorColor: Colors.dark.separatorColor,
            modalOverlayBackgroundColor: Colors.dark.modalOverlayBackgroundColor,
            transparent: Colors.dark.transparent,
            iconColor: Colors.dark.iconColor,
            borderColor: Colors.dark.borderColor,
            bottomSheetBackground: Colors.dark.bottomSheetBackground,
          }
        : {
            background: Colors.light.background,
            separatorColor: Colors.dark.separatorColor,
            modalOverlayBackgroundColor: Colors.light.modalOverlayBackgroundColor,
            transparent: Colors.light.transparent,
            iconColor: Colors.light.iconColor,
            borderColor: Colors.light.borderColor,
            bottomSheetBackground: Colors.light.bottomSheetBackground,
          },
    [colorScheme],
  );

  return (
    <FlatList
      showsVerticalScrollIndicator={Platform.OS === 'web'}
      data={options}
      renderItem={({ item, index }) => (
        <Pressable
          style={{
            width: '100%',
            alignSelf: 'stretch',
            alignItems: 'center',
            borderBottomWidth: 1,
            borderBottomColor: colors.borderColor,
            justifyContent: 'center',
            height: 45,
          }}
          onPress={() => {
            onSelect(item);
          }}
        >
          <Text text={item.label} key={index} style={[{ fontWeight: 500 }, textStyle]} />
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  listContainer: {
    borderTopRightRadius: 10,
    borderTopLeftRadius: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
    width: '100%',
    borderBottomWidth: 1,
    borderColor: 'white',
  },
});
