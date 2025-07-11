import { useColors } from '@/src/context/ColorsContext';
import { formatDate } from '@/src/utils/formatters';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useCallback, useState } from 'react';
import { Platform, StyleSheet, TouchableOpacity } from 'react-native';
import { TextField } from './TextField';
import { Text, View } from './Themed';

export const DateSelector = ({
  label,
  selectedDate,
  setSelectedDate,
}: {
  label: string;
  selectedDate: Date;
  setSelectedDate(date: Date): void;
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleAndroidShowDatePicker = useCallback((): void => {
    setShowDatePicker(!showDatePicker);
  }, []);

  const colors = useColors();

  const handleDateChange = useCallback((event: any, selectedDate: Date | undefined) => {
    if (Platform.OS !== 'ios') setShowDatePicker(false);

    if (selectedDate) {
      setSelectedDate(selectedDate);
    }
  }, []);

  return (
    <View style={[styles.input, { flexDirection: 'row' }]}>
      {Platform.OS === 'android' && (
        <TouchableOpacity activeOpacity={1} onPress={handleAndroidShowDatePicker}>
          <View pointerEvents="none" style={{ minWidth: 240, borderColor: colors.transparent }}>
            <TextField
              value={selectedDate ? formatDate(selectedDate) : undefined}
              placeholder={label}
              label={label}
              editable={false}
              inputWrapperStyle={{ borderColor: colors.transparent, alignSelf: 'stretch' }}
              style={{ borderColor: colors.transparent, alignSelf: 'stretch' }}
            />
          </View>
        </TouchableOpacity>
      )}
      {Platform.OS === 'ios' && <Text txtSize="formLabel" text={label} />}
      {showDatePicker && (
        <DateTimePicker
          style={{ alignSelf: 'stretch' }}
          value={selectedDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: 300,
    padding: 20,
    borderRadius: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 10,
    paddingLeft: 8,
    borderRadius: 5,
  },
  dateButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    alignItems: 'center',
  },
  dateButtonText: {
    color: 'white',
  },
  buttons: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-evenly',
  },
});
