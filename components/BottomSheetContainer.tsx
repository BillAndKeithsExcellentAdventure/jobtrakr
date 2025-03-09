import { DimensionValue, Modal, Pressable, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import { PropsWithChildren, useCallback, useMemo } from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { View, Text } from './Themed';
import { useColorScheme } from './useColorScheme';
import { ActionButton } from './ActionButton';

type Props = PropsWithChildren<{
  isVisible: boolean;
  onClose: () => void;
  title?: string;
  modalHeight?: DimensionValue;
}>;

export default function BottomSheetContainer({
  isVisible,
  children,
  onClose,
  title,
  modalHeight = '40%',
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

  if (!isVisible) return null;

  return (
    <Modal animationType="slide" transparent={true} visible={isVisible} onRequestClose={() => onClose()}>
      <TouchableWithoutFeedback onPress={() => onClose()}>
        <View style={{ flex: 1, backgroundColor: 'transparent' }}>
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
                  ]}
                >
                  <Text txtSize="standard" style={[{ fontWeight: '600' }]} text={title} />
                  <Pressable onPress={() => onClose()}>
                    <MaterialIcons name="close" color={colors.iconColor} size={22} />
                  </Pressable>
                </View>
              ) : (
                <View style={{ height: 10 }} />
              )}
              {children}
            </View>
          </View>
        </View>
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
});
