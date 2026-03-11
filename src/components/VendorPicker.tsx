import { ActionButton } from '@/src/components/ActionButton';
import BottomSheetContainer from '@/src/components/BottomSheetContainer';
import { TextField } from '@/src/components/TextField';
import { Text, View, TextInput } from '@/src/components/Themed';
import { useColors } from '@/src/context/ColorsContext';
import { VendorData, useAddRowCallback } from '@/src/tbStores/configurationStore/ConfigurationStoreHooks';
import { useAuth } from '@clerk/clerk-expo';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Keyboard, Platform, StyleSheet } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import { useNetwork } from '../context/NetworkContext';
import { addVendor } from '../utils/quickbooksAPI';

interface VendorPickerProps {
  style?: any;
  selectedVendor?: VendorData;
  onVendorSelected: (vendor: VendorData) => void;
  vendors: VendorData[];
  label?: string;
  placeholder?: string;
}

export const VendorPicker = ({
  selectedVendor,
  onVendorSelected,
  vendors,
  label,
  placeholder = 'Select a vendor',
  style = {},
}: VendorPickerProps) => {
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const [searchText, setSearchText] = useState<string>('');
  const [isAddVendorModalVisible, setIsAddVendorModalVisible] = useState(false);
  const [isAddingVendor, setIsAddingVendor] = useState(false);
  const [newVendor, setNewVendor] = useState<VendorData>({
    id: '',
    accountingId: '',
    name: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    mobilePhone: '',
    businessPhone: '',
    notes: '',
    inactive: false,
  });
  const colors = useColors();
  const addVendorToStore = useAddRowCallback('vendors');
  const { isQuickBooksAccessible } = useNetwork();
  const auth = useAuth();
  const { orgId, userId, getToken } = auth;

  // Filter to only show active vendors
  const activeVendors = useMemo(
    () => vendors.filter((v) => !v.inactive).sort((a, b) => a.name.localeCompare(b.name)),
    [vendors],
  );

  // Filter based on search text
  const filteredVendors = useMemo(() => {
    if (!searchText.trim()) {
      return activeVendors;
    }
    const searchLower = searchText.toLowerCase();
    return activeVendors.filter(
      (vendor) =>
        vendor.name.toLowerCase().includes(searchLower) ||
        vendor.address?.toLowerCase().includes(searchLower) ||
        vendor.notes?.toLowerCase().includes(searchLower),
    );
  }, [activeVendors, searchText]);

  const handleInputChange = useCallback((name: keyof VendorData, value: string) => {
    setNewVendor((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  const handleAddVendor = useCallback(async () => {
    if (!newVendor.name.trim()) {
      Alert.alert('Error', 'Vendor name is required');
      return;
    }

    setIsAddingVendor(true);
    try {
      let accountingId = '';

      if (isQuickBooksAccessible) {
        if (!orgId || !userId) {
          console.error('Missing orgId or userId');
          return;
        }

        const addQbVendorResult = await addVendor(
          orgId,
          userId,
          {
            name: newVendor.name,
            mobilePhone: newVendor.mobilePhone || '',
            address: newVendor.address || '',
            city: newVendor.city || '',
            state: newVendor.state || '',
            zip: newVendor.zip || '',
            notes: newVendor.notes || '',
          },
          getToken,
        );

        if (!addQbVendorResult || !addQbVendorResult.success) {
          console.error(
            'Failed to add vendor to QuickBooks:',
            addQbVendorResult ? addQbVendorResult.message : 'Unknown error',
          );
          return;
        } else {
          accountingId = addQbVendorResult.newQBId ?? '';
        }
      }

      const result = addVendorToStore({ ...newVendor, accountingId });

      if (result && result.status !== 'Success') {
        Alert.alert('Error', `Failed to add vendor: ${result.msg}`);
        return;
      }

      // The new vendor was added, select it
      const addedVendor: VendorData = {
        ...newVendor,
        id: result.id || newVendor.id,
      };

      onVendorSelected(addedVendor);

      // Reset state and close both modals
      setNewVendor({
        id: '',
        accountingId: '',
        name: '',
        address: '',
        city: '',
        state: '',
        zip: '',
        mobilePhone: '',
        businessPhone: '',
        notes: '',
        inactive: false,
      });
      setSearchText('');
      setIsAddVendorModalVisible(false);
    } finally {
      setIsAddingVendor(false);
    }
  }, [newVendor, addVendorToStore, onVendorSelected, orgId, userId, getToken, isQuickBooksAccessible]);

  const handleVendorSelect = useCallback(
    (vendor: VendorData) => {
      onVendorSelected(vendor);
      setIsPickerVisible(false);
      setSearchText('');
    },
    [onVendorSelected],
  );

  const toggleModalPicker = useCallback(() => {
    Keyboard.dismiss();
    setIsPickerVisible(true);
  }, []);

  const displayText = selectedVendor ? selectedVendor.name : '';

  const handleAddVendorPress = () => {
    setIsPickerVisible(false);
    // delay opening the add vendor modal to allow the first bottom sheet to close
    setTimeout(() => {
      setIsAddVendorModalVisible(true);
    }, 300);
  };

  return (
    <>
      <Pressable onPress={toggleModalPicker}>
        <View style={{ ...styles.pickerRow, ...style }}>
          <View style={{ flex: 1, backgroundColor: 'transparent' }}>
            <TextField
              label={label}
              style={{ color: colors.text }}
              placeholder={placeholder}
              value={displayText}
              editable={false}
            />
          </View>
          <View style={styles.pickerButtonContainer}>
            <Ionicons name="ellipsis-horizontal-circle" size={36} color={colors.iconColor} />
          </View>
        </View>
      </Pressable>

      <BottomSheetContainer
        isVisible={isPickerVisible}
        onClose={() => {
          setIsPickerVisible(false);
          setSearchText('');
        }}
        title="Select Vendor"
        modalHeight="75%"
      >
        <View style={{ flex: 1, backgroundColor: colors.listBackground }}>
          <View style={[styles.searchContainer, { borderBottomColor: colors.border, height: 56 }]}>
            <View
              style={{
                flex: 1,
                width: '100%',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                justifyContent: 'space-between',
              }}
            >
              <View
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  borderWidth: 1,
                  borderRadius: 8,
                  paddingLeft: 10,
                  paddingRight: 5,
                  borderColor: colors.border,
                }}
              >
                <TextInput
                  style={[
                    styles.searchInput,
                    {
                      backgroundColor: colors.inputBackground,
                      color: colors.text,
                    },
                  ]}
                  placeholder="Search vendors..."
                  placeholderTextColor={colors.textPlaceholder}
                  value={searchText}
                  onChangeText={setSearchText}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Pressable onPress={() => setSearchText('')}>
                  <MaterialIcons name="clear" size={24} color={colors.iconColor} />
                </Pressable>
              </View>
              <Pressable onPress={handleAddVendorPress}>
                <View
                  style={{
                    width: 48,
                    height: 48,
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderWidth: 1,
                    borderRadius: 24,
                    borderColor: colors.border,
                  }}
                >
                  <Ionicons name="person-add-sharp" size={24} color={colors.iconColor} />
                </View>
              </Pressable>
            </View>
          </View>

          <FlatList
            showsVerticalScrollIndicator={Platform.OS === 'web'}
            data={filteredVendors}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Pressable
                style={[
                  {
                    width: '100%',
                    borderBottomWidth: 1,
                    borderBottomColor: colors.separatorColor,
                    justifyContent: 'center',
                  },
                  selectedVendor?.id === item.id && {
                    backgroundColor: colors.neutral200,
                  },
                ]}
                onPress={() => handleVendorSelect(item)}
              >
                <View style={{ paddingHorizontal: 12, paddingVertical: 8 }}>
                  <Text
                    style={[
                      { fontWeight: 500, fontSize: 16 },
                      selectedVendor?.id === item.id && {
                        fontWeight: 800,
                        fontSize: 16,
                      },
                    ]}
                  >
                    {item.name}
                  </Text>
                  {item.address ? (
                    <Text
                      style={{
                        fontSize: 14,
                        color: colors.textMuted,
                        marginTop: 2,
                      }}
                    >
                      {item.address}
                    </Text>
                  ) : null}
                </View>
              </Pressable>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text>No active vendors found</Text>
              </View>
            }
          />
        </View>
      </BottomSheetContainer>

      <BottomSheetContainer
        keyboardVerticalOffset={100}
        isVisible={isAddVendorModalVisible}
        onClose={() => {
          setIsAddVendorModalVisible(false);
          setNewVendor({
            id: '',
            accountingId: '',
            name: '',
            address: '',
            city: '',
            state: '',
            zip: '',
            mobilePhone: '',
            businessPhone: '',
            notes: '',
            inactive: false,
          });
        }}
        title="Add New Vendor"
        modalHeight="80%"
      >
        <View style={{ padding: 15, gap: 10 }}>
          <TextInput
            style={[styles.input, { backgroundColor: colors.neutral200 }]}
            placeholder="Vendor Name"
            value={newVendor.name}
            autoCapitalize="words"
            onChangeText={(text) => handleInputChange('name', text)}
          />
          <TextInput
            style={[styles.input, { backgroundColor: colors.neutral200 }]}
            placeholder="Address"
            value={newVendor.address}
            autoCapitalize="words"
            onChangeText={(text) => handleInputChange('address', text)}
          />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TextInput
              style={[styles.input, { backgroundColor: colors.neutral200, flex: 1 }]}
              placeholder="City"
              value={newVendor.city}
              autoCapitalize="words"
              onChangeText={(text) => handleInputChange('city', text)}
            />
            <TextInput
              style={[styles.input, { backgroundColor: colors.neutral200, width: 60 }]}
              placeholder="State"
              value={newVendor.state}
              autoCapitalize="characters"
              maxLength={2}
              onChangeText={(text) => handleInputChange('state', text)}
            />
            <TextInput
              style={[styles.input, { backgroundColor: colors.neutral200, width: 90 }]}
              placeholder="Zip"
              value={newVendor.zip}
              keyboardType="number-pad"
              onChangeText={(text) => handleInputChange('zip', text)}
            />
          </View>
          <TextInput
            style={[styles.input, { backgroundColor: colors.neutral200 }]}
            placeholder="Mobile Phone"
            value={newVendor.mobilePhone}
            keyboardType="phone-pad"
            onChangeText={(text) => handleInputChange('mobilePhone', text)}
          />
          <TextInput
            style={[styles.input, { backgroundColor: colors.neutral200 }]}
            placeholder="Business Phone"
            value={newVendor.businessPhone}
            keyboardType="phone-pad"
            onChangeText={(text) => handleInputChange('businessPhone', text)}
          />
          <TextInput
            style={[styles.input, { backgroundColor: colors.neutral200 }]}
            placeholder="Notes"
            value={newVendor.notes}
            multiline
            numberOfLines={2}
            onChangeText={(text) => handleInputChange('notes', text)}
          />
          {isAddingVendor ? (
            <View style={{ alignItems: 'center', paddingVertical: 15 }}>
              <ActivityIndicator size="large" color={colors.tint} />
              <Text style={{ marginTop: 10, fontSize: 16, fontWeight: '600' }}>Adding new vendor...</Text>
            </View>
          ) : (
            <ActionButton
              onPress={handleAddVendor}
              type={newVendor.name.trim() ? 'action' : 'disabled'}
              title="Add Vendor"
              triggerBlurOnPress={false}
            />
          )}
        </View>
      </BottomSheetContainer>
    </>
  );
};

const styles = StyleSheet.create({
  pickerRow: {
    width: '100%',
    flexDirection: 'row',
    backgroundColor: 'transparent',
  },
  pickerButtonContainer: {
    paddingLeft: 10,
    justifyContent: 'flex-end',
  },
  searchContainer: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    padding: 6,
    borderRadius: 5,
    alignItems: 'center',
  },
});
