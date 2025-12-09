import React, { useMemo, useState } from 'react';
import { Modal, Button, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { OptionEntry } from './OptionList';
import { Text, View } from '@/src/components/Themed';

const ZoomPicker = ({
  value,
  onZoomChange,
}: {
  value: number;
  onZoomChange: (zoomFactor: number) => void;
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  const options: OptionEntry[] = useMemo(
    () => [
      { label: 'None', value: 0.0 },
      { label: '25%', value: 0.25 },
      { label: '50%', value: 0.5 },
      { label: '75%', value: 0.75 },
      { label: 'Max', value: 1.0 },
    ],
    [],
  );

  return (
    <View style={styles.container}>
      {Platform.OS === 'ios' ? (
        <>
          <TouchableOpacity style={styles.selector} onPress={() => setModalVisible(true)}>
            <Text style={styles.selectorText}>Zoom: {value}</Text>
          </TouchableOpacity>

          <Modal animationType="slide" transparent={true} visible={modalVisible}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Picker selectedValue={value} onValueChange={onZoomChange}>
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
              selectedValue={value}
              onValueChange={onZoomChange}
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
