import { ActionButtonProps, ButtonBar } from '@/src/components/ButtonBar';
import { View } from '@/src/components/Themed';
import { useColors } from '@/src/context/ColorsContext';
import React from 'react';
import { Modal, Platform, StyleSheet, TouchableWithoutFeedback } from 'react-native';

const RightHeaderMenu = ({
  modalVisible,
  setModalVisible,
  buttons,
  actionContext,
}: {
  modalVisible: boolean;
  setModalVisible: (val: boolean) => void;
  buttons: ActionButtonProps[];
  actionContext?: any;
}) => {
  const colors = useColors();
  const topMargin = Platform.OS === 'ios' ? 102 : 50;

  if (!modalVisible) return null;

  return (
    <Modal
      animationType={Platform.OS === 'ios' ? 'fade' : 'none'}
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)} // Close on back press
    >
      <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: colors.modalOverlayBackgroundColor }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.background, marginTop: topMargin }]}>
            <ButtonBar buttons={buttons} actionContext={actionContext} vertical />
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default RightHeaderMenu;

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  modalOverlay: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    ...Platform.select({
      android: {
        backgroundColor: 'rgba(0,0,0,0.5)',
      },
    }),
  },
  modalContent: {
    marginRight: 10,
    borderRadius: 10,
    paddingHorizontal: 5,
    elevation: 5,
    zIndex: 1000, // Add this
    ...Platform.select({
      android: {
        elevation: 5,
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
    }),
  },
});
