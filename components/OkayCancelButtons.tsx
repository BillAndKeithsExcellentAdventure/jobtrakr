import { StyleSheet } from 'react-native';
import React from 'react';
import { ActionButton } from './ActionButton';
import { View } from './Themed';
import { router } from 'expo-router';

const OkayCancelButtons = ({
  okTitle = 'Save',
  isOkEnabled,
  onOkPress,
  onCancelPress = () => {
    router.back();
  },
}: {
  okTitle?: string;
  isOkEnabled: boolean;
  onOkPress: () => void;
  onCancelPress?: () => void;
}) => {
  return (
    <View style={styles.saveButtonRow}>
      <ActionButton
        style={styles.saveButton}
        onPress={onOkPress}
        type={isOkEnabled ? 'ok' : 'disabled'}
        title={okTitle}
      />
      <ActionButton style={styles.cancelButton} onPress={onCancelPress} type={'cancel'} title="Cancel" />
    </View>
  );
};

const styles = StyleSheet.create({
  saveButtonRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  saveButton: {
    flex: 1,
    marginRight: 5,
  },
  cancelButton: {
    flex: 1,
    marginLeft: 5,
  },
});

export default OkayCancelButtons;
