import { ActionButton } from '@/src/components/ActionButton';
import { Text, View } from '@/src/components/Themed';
import { useColors } from '@/src/context/ColorsContext';
import { Stack } from 'expo-router';
import React, { PropsWithChildren } from 'react';
import { ActivityIndicator, Platform, StyleSheet } from 'react-native';
import { KeyboardAwareScrollView, KeyboardToolbar } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IOS_KEYBOARD_TOOLBAR_OFFSET } from '../constants/app-constants';

const BUTTON_ROW_HEIGHT = 62;

type ModalScreenContainerProps = PropsWithChildren<{
  onSave: () => void;
  onCancel: () => void;
  canSave?: boolean;
  saveButtonTitle?: string;
  cancelButtonTitle?: string;
  isSaving?: boolean;
  savingLabel?: string;
}>;

export const ModalScreenContainer: React.FC<ModalScreenContainerProps> = ({
  onSave,
  onCancel,
  canSave = true,
  saveButtonTitle = 'Save',
  cancelButtonTitle = 'Cancel',
  isSaving = false,
  savingLabel = 'Saving',
  children,
}) => {
  const colors = useColors();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <SafeAreaView
        edges={['top', 'right', 'bottom', 'left']}
        style={[styles.modalBackground, { backgroundColor: colors.modalOverlayBackgroundColor }]}
      >
        <KeyboardAwareScrollView
          bottomOffset={BUTTON_ROW_HEIGHT}
          style={[
            { backgroundColor: colors.modalOverlayBackgroundColor, flex: 1, marginBottom: BUTTON_ROW_HEIGHT },
          ]}
          contentContainerStyle={styles.modalContainer}
        >
          <View style={styles.container}>
            {children}

            {isSaving ? (
              <View style={styles.savingRow}>
                <ActivityIndicator />
                <Text txtSize="standard" style={styles.savingText} text={savingLabel} />
              </View>
            ) : (
              <View style={styles.saveButtonRow}>
                <ActionButton
                  style={styles.saveButton}
                  onPress={onSave}
                  type={canSave ? 'ok' : 'disabled'}
                  title={saveButtonTitle}
                />
                <ActionButton
                  style={styles.cancelButton}
                  onPress={onCancel}
                  type="cancel"
                  title={cancelButtonTitle}
                />
              </View>
            )}
          </View>
        </KeyboardAwareScrollView>
      </SafeAreaView>
      {Platform.OS === 'ios' && <KeyboardToolbar offset={{ opened: IOS_KEYBOARD_TOOLBAR_OFFSET }} />}
    </>
  );
};

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'stretch',
  },
  container: {
    width: '100%',
    padding: 10,
    borderRadius: 20,
    flex: 1,
    elevation: 20, // Adds shadow effect for Android
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
  },
  modalContainer: {
    width: '100%',
    padding: 10,
  },
  saveButtonRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  savingRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  savingText: {
    marginLeft: 10,
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
