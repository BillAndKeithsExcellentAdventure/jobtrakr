import { ActionButton } from '@/src/components/ActionButton';
import { View } from '@/src/components/Themed';
import { useColors } from '@/src/context/ColorsContext';
import { Stack } from 'expo-router';
import React, { PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { KeyboardToolbar } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';

type ModalScreenContainerWithListProps = PropsWithChildren<{
  onSave: () => void;
  onCancel: () => void;
  canSave?: boolean;
  saveButtonTitle?: string;
  cancelButtonTitle?: string;
}>;

/**
 * ModalScreenContainerWithList is a variant of ModalScreenContainer that uses
 * KeyboardAvoidingView instead of KeyboardAwareScrollView.
 *
 * Use this variant when your modal content contains scrollable lists (FlatList, SectionList, FlashList)
 * as KeyboardAwareScrollView can interfere with nested scrollable components.
 *
 * The children should manage their own scrolling (e.g., include a FlatList).
 */
export const ModalScreenContainerWithList: React.FC<ModalScreenContainerWithListProps> = ({
  onSave,
  onCancel,
  canSave = true,
  saveButtonTitle = 'Save',
  cancelButtonTitle = 'Cancel',
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
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <View style={styles.container}>
            {children}

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
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
      {Platform.OS === 'ios' && <KeyboardToolbar />}
    </>
  );
};

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'stretch',
  },
  keyboardAvoidingView: {
    flex: 1,
    width: '100%',
  },
  container: {
    margin: 10,
    padding: 10,
    borderRadius: 20,
    flex: 1,
    elevation: 20, // Adds shadow effect for Android
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
  },
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
