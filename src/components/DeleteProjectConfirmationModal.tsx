import React, { useCallback, useEffect, useState } from 'react';
import { Modal, Platform, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActionButton } from './ActionButton';
import { Text, TextInput } from './Themed';
import { useColors } from '@/src/context/ColorsContext';
import { KeyboardToolbar } from 'react-native-keyboard-controller';
import { IOS_KEYBOARD_TOOLBAR_OFFSET } from '../constants/app-constants';

interface DeleteProjectConfirmationModalProps {
  isVisible: boolean;
  onClose: () => void;
  onConfirmDelete: () => void;
  projectName: string;
}

export const DeleteProjectConfirmationModal: React.FC<DeleteProjectConfirmationModalProps> = ({
  isVisible,
  onClose,
  onConfirmDelete,
  projectName,
}) => {
  const colors = useColors();
  const [deleteText, setDeleteText] = useState('');

  // Reset the text field when modal opens
  useEffect(() => {
    if (isVisible) {
      setDeleteText('');
    }
  }, [isVisible]);

  const handleDelete = useCallback(() => {
    if (deleteText.toLowerCase() === 'delete') {
      onConfirmDelete();
      onClose();
    }
  }, [deleteText, onConfirmDelete, onClose]);

  const handleClose = useCallback(() => {
    setDeleteText('');
    onClose();
  }, [onClose]);

  const canDelete = deleteText.toLowerCase() === 'delete';

  return (
    <Modal visible={isVisible} transparent={true} animationType="fade">
      <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
        <View style={[styles.container, { backgroundColor: colors.opaqueModalOverlayBackgroundColor }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Text txtSize="title" style={styles.title}>
              Confirm Project Deletion
            </Text>

            <View style={styles.form}>
              <Text style={styles.warningText}>
                Since we cannot undo a project deletion, please type the word &quot;delete&quot; in the field
                below to further verify that this project should be deleted.
              </Text>

              <Text txtSize="formLabel" style={styles.projectNameLabel}>
                Project: {projectName}
              </Text>

              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                placeholder='Type "delete" to confirm'
                value={deleteText}
                onChangeText={setDeleteText}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <View style={styles.buttonContainer}>
                <ActionButton
                  style={styles.button}
                  type={canDelete ? 'ok' : 'disabled'}
                  title="Delete"
                  onPress={handleDelete}
                />
                <ActionButton style={styles.button} type="cancel" title="Cancel" onPress={handleClose} />
              </View>
            </View>
          </View>
        </View>
      </SafeAreaView>
      {Platform.OS === 'ios' && <KeyboardToolbar offset={{ opened: IOS_KEYBOARD_TOOLBAR_OFFSET }} />}
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 10,
  },
  modalContent: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 10,
    padding: 20,
  },
  title: {
    textAlign: 'center',
    marginBottom: 20,
  },
  form: {
    gap: 15,
  },
  warningText: {
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
  },
  projectNameLabel: {
    textAlign: 'center',
    fontWeight: 'bold',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    height: 45,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 10,
  },
  button: {
    flex: 1,
  },
});
