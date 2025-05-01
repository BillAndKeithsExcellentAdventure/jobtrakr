import React, { useMemo, useState } from 'react';
import { Modal, Button, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { OptionEntry } from './OptionList';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from './useColorScheme';
import { Text, View } from '@/components/Themed';

const ZoomPicker = () => {
  const [modalVisible, setModalVisible] = useState(false);

  const options: OptionEntry[] = useMemo(
    () => [
      { label: '1x', value: 1.0 },
      { label: '1.25x', value: 1.25 },
      { label: '1.5x', value: 1.5 },
      { label: '1.75x', value: 1.75 },
      { label: '2x', value: 2.0 },
    ],
    [],
  );

  const [selectedValue, setSelectedValue] = useState(options[0].value);
  const colorScheme = useColorScheme();
  const colors = useMemo(
    () =>
      colorScheme === 'dark'
        ? {
            background: Colors.dark.background,
            borderColor: Colors.dark.inputBorder,
            modalOverlayBackgroundColor: Colors.dark.modalOverlayBackgroundColor,
            transparent: Colors.dark.transparent,
            neutral200: Colors.dark.neutral200,
            buttonBlue: Colors.dark.buttonBlue,
            iconColor: Colors.dark.iconColor,
          }
        : {
            background: Colors.light.background,
            borderColor: Colors.light.inputBorder,
            modalOverlayBackgroundColor: Colors.light.modalOverlayBackgroundColor,
            transparent: Colors.light.transparent,
            neutral200: Colors.light.neutral200,
            buttonBlue: Colors.light.buttonBlue,
            iconColor: Colors.light.iconColor,
          },
    [colorScheme],
  );

  return (
    <View style={styles.container}>
      {Platform.OS === 'ios' ? (
        <>
          <TouchableOpacity style={styles.selector} onPress={() => setModalVisible(true)}>
            <Text style={styles.selectorText}>Zoom: {selectedValue}</Text>
          </TouchableOpacity>

          <Modal animationType="slide" transparent={true} visible={modalVisible}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Picker
                  selectedValue={selectedValue}
                  onValueChange={(itemValue) => setSelectedValue(itemValue)}
                >
                  {options.map((option) => (
                    <Picker.Item key={option.label} label={option.label} value={option.value} color="black" />
                  ))}
                </Picker>
                <Button title="Done" onPress={() => setModalVisible(false)} />
              </View>
            </View>
          </Modal>
        </>
      ) : (
        // Android: show inline picker
        <View style={[styles.androidPickerContainer, { backgroundColor: 'rgba(255, 255, 255, 0.72)' }]}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: 'transparent',
            }}
          >
            <Text
              txtSize="sub-title"
              style={[
                styles.selectorText,
                { backgroundColor: 'transparent', color: 'black', alignSelf: 'center' },
              ]}
            >
              Zoom:
            </Text>
            <Picker
              selectedValue={selectedValue}
              onValueChange={(itemValue) => setSelectedValue(itemValue)}
              style={[styles.androidPicker]}
              dropdownIconColor={'black'}
              mode="dropdown"
              itemStyle={{ color: 'black', alignSelf: 'center' }}
            >
              {options.map((option) => (
                <Picker.Item key={option.label} label={option.label} value={option.value} color={'#000'} />
              ))}
            </Picker>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { backgroundColor: 'rgba(0, 0, 0, 0.3)', borderRadius: 15 },
  selector: {
    alignItems: 'center',
    borderRadius: 8,
    padding: 10,
    paddingHorizontal: 20,
  },
  selectorText: {
    width: 110,
    paddingHorizontal: 5,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'transparent',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    paddingBottom: Platform.OS === 'ios' ? 30 : 10,
  },
  androidPickerContainer: {
    borderRadius: 8,
  },
  androidPicker: {
    alignContent: 'center',
    alignItems: 'center',
    width: 120,
  },
});

export default ZoomPicker;
