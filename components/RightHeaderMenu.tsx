import { ActionButtonProps, ButtonBar } from '@/components/ButtonBar';
import { View } from '@/components/Themed';
import { Colors } from '@/constants/Colors';
import React, { useMemo } from 'react';
import { Modal, Platform, StyleSheet, TouchableWithoutFeedback, useColorScheme } from 'react-native';

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
  const colorScheme = useColorScheme();
  const colors = useMemo(
    () =>
      colorScheme === 'dark'
        ? {
            screenBackground: Colors.dark.background,
            separatorColor: Colors.dark.separatorColor,
            modalOverlayBackgroundColor: Colors.dark.modalOverlayBackgroundColor,
          }
        : {
            screenBackground: Colors.light.background,
            separatorColor: Colors.light.separatorColor,
            modalOverlayBackgroundColor: Colors.light.modalOverlayBackgroundColor,
          },
    [colorScheme],
  );

  const topMargin = Platform.OS === 'ios' ? 102 : 50;

  if (!modalVisible) return null;

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)} // Close on back press
    >
      <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: colors.modalOverlayBackgroundColor }]}>
          <View
            style={[styles.modalContent, { backgroundColor: colors.screenBackground, marginTop: topMargin }]}
          >
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
  },
  modalContent: {
    marginRight: 10,
    borderRadius: 10,
    paddingHorizontal: 5,
    elevation: 5, // To give the modal a slight shadow
  },
});
