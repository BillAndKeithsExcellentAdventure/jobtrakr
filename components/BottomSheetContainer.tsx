import { DimensionValue, Modal, Pressable, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import { PropsWithChildren, useMemo } from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { View, Text } from './Themed';
import { useColorScheme } from './useColorScheme';
import { ActionButton } from './ActionButton';

type Props = PropsWithChildren<{
  isVisible: boolean;
  onClose: (okPressed?: boolean) => void;
  title?: string;
  showOkCancel?: boolean;
  modalHeight?: DimensionValue;
  isOkEnabled?: boolean;
}>;

export default function BottomSheetContainer({
  isVisible,
  children,
  onClose,
  title,
  modalHeight = '40%',
  showOkCancel,
  isOkEnabled,
}: Props) {
  const { bottom, top } = useSafeAreaInsets();
  const colorScheme = useColorScheme();

  const colors = useMemo(
    () =>
      colorScheme === 'dark'
        ? {
            background: Colors.dark.background,
            modalOverlayBackgroundColor: Colors.dark.modalOverlayBackgroundColor,
            transparent: Colors.dark.transparent,
            iconColor: Colors.dark.iconColor,
            borderColor: Colors.dark.separatorColor,
            bottomSheetBackground: Colors.dark.bottomSheetBackground,
          }
        : {
            background: Colors.light.background,
            modalOverlayBackgroundColor: Colors.light.modalOverlayBackgroundColor,
            transparent: Colors.light.transparent,
            iconColor: Colors.light.iconColor,
            borderColor: Colors.light.separatorColor,
            bottomSheetBackground: Colors.light.bottomSheetBackground,
          },
    [colorScheme],
  );

  return (
    <Modal animationType="slide" transparent={true} visible={isVisible}>
      <TouchableWithoutFeedback onPress={() => onClose(false)}>
        <>
          <View
            style={{
              flex: 1,
              marginTop: top,
              marginBottom: bottom,
              backgroundColor: colors.modalOverlayBackgroundColor,
            }}
          >
            <View style={[styles.modalContent, { bottom: 0, height: modalHeight }]}>
              {title ? (
                <View
                  style={[
                    styles.titleContainer,
                    {
                      backgroundColor: colors.bottomSheetBackground,
                      borderBottomWidth: 2,
                      borderColor: colors.borderColor,
                    },
                    showOkCancel && { justifyContent: 'center' },
                  ]}
                >
                  <Text txtSize="standard" style={[{ fontWeight: '600' }]} text={title} />
                  {!showOkCancel && (
                    <Pressable onPress={() => onClose(false)}>
                      <MaterialIcons name="close" color={colors.iconColor} size={22} />
                    </Pressable>
                  )}
                </View>
              ) : (
                <View style={{ height: 10 }} />
              )}
              {children}
              {showOkCancel && (
                <View style={{ borderTopColor: colors.borderColor }}>
                  <View style={[styles.saveButtonRow, { borderTopColor: colors.borderColor }]}>
                    <ActionButton
                      style={styles.saveButton}
                      onPress={() => onClose(true)}
                      type={isOkEnabled ? 'ok' : 'disabled'}
                      title="Save"
                    />
                    <ActionButton
                      style={styles.cancelButton}
                      onPress={() => onClose(false)}
                      type={'cancel'}
                      title="Cancel"
                    />
                  </View>
                </View>
              )}
            </View>
          </View>
        </>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContent: {
    width: '100%',
    borderTopRightRadius: 18,
    borderTopLeftRadius: 18,
    position: 'absolute',
  },
  titleContainer: {
    height: 40,
    borderTopRightRadius: 10,
    borderTopLeftRadius: 10,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  saveButtonRow: {
    paddingHorizontal: 10,
    borderTopWidth: 2,
    marginTop: 10,
    paddingTop: 10,
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
