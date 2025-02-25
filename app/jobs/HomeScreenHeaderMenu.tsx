import { View, Text } from '@/components/Themed';
import { Colors } from '@/constants/Colors';
import React, { useMemo } from 'react';
import {
  useColorScheme,
  Platform,
  SafeAreaView,
  Modal,
  StyleSheet,
  TouchableWithoutFeedback,
  TouchableOpacity,
} from 'react-native';

const HomeScreenHeaderMenu = ({
  modalVisible,
  setModalVisible,
  onMenuItemPress,
}: {
  modalVisible: boolean;
  setModalVisible: (val: boolean) => void;
  onMenuItemPress: (item: string) => void;
}) => {
  const handleMenuItemPress = (item: string): void => {
    console.log(`${item} pressed`);
    setModalVisible(false); // Close the modal after selecting an item
    onMenuItemPress(item);
  };

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

  const topMargin = Platform.OS === 'ios' ? 110 : 50;

  return (
    <SafeAreaView>
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)} // Close on back press
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={[styles.modalOverlay, { backgroundColor: colors.modalOverlayBackgroundColor }]}>
            <View
              style={[
                styles.modalContent,
                { backgroundColor: colors.screenBackground, marginTop: topMargin },
              ]}
            >
              <TouchableOpacity
                onPress={() => handleMenuItemPress('AddJob')}
                style={[styles.menuItem, { borderBottomColor: colors.separatorColor }]}
              >
                <Text style={styles.menuText}>Add Job</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleMenuItemPress('Option 1')}
                style={[styles.menuItem, { borderBottomColor: colors.separatorColor }]}
              >
                <Text style={styles.menuText}>Option 1</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleMenuItemPress('Option 2')}
                style={[styles.menuItem, { borderBottomColor: colors.separatorColor }]}
              >
                <Text style={styles.menuText}>Option 2</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
};

export default HomeScreenHeaderMenu;

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  twoColListContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: 10,
  },
  modalOverlay: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
  },
  modalContent: {
    marginRight: 10,
    borderRadius: 10,
    paddingHorizontal: 10,
    width: 150,
    elevation: 5, // To give the modal a slight shadow
  },
  menuItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  menuText: {
    fontSize: 16,
  },
});
