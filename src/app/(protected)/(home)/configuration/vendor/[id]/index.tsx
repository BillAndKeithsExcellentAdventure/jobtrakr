import { ActionButton } from '@/src/components/ActionButton';
import BottomSheetContainer from '@/src/components/BottomSheetContainer';
import OptionList, { OptionEntry } from '@/src/components/OptionList';
import { Text, TextInput, View } from '@/src/components/Themed';
import { useColors } from '@/src/context/ColorsContext';
import { useNetwork } from '@/src/context/NetworkContext';
import {
  useAllRows,
  useTypedRow,
  useUpdateRowCallback,
  VendorData,
  VendorDataCompareName,
} from '@/src/tbStores/configurationStore/ConfigurationStoreHooks';
import { addVendor } from '@/src/utils/quickbooksAPI';
import { useAuth } from '@clerk/clerk-expo';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Modal, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const EditVendor = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { orgId, userId, getToken } = useAuth();
  const { isQuickBooksAccessible } = useNetwork();
  const router = useRouter();
  const applyVendorUpdates = useUpdateRowCallback('vendors');
  const allVendors = useAllRows('vendors', VendorDataCompareName);
  const colors = useColors();
  const [isLinkVendorPickerVisible, setIsLinkVendorPickerVisible] = useState(false);
  const [processingInfo, setProcessingInfo] = useState<{ isProcessing: boolean; label: string }>({
    isProcessing: false,
    label: '',
  });
  const startProcessing = useCallback(
    (label: string) => setProcessingInfo({ isProcessing: true, label }),
    [],
  );
  const stopProcessing = useCallback(() => setProcessingInfo({ isProcessing: false, label: '' }), []);
  const [updatedVendor, setUpdatedVendor] = useState<VendorData>({
    id: '',
    name: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    mobilePhone: '',
    businessPhone: '',
    notes: '',
    accountingId: '',
    inactive: false,
  });

  const vendorFromStore = useTypedRow('vendors', id);

  // Prevent infinite re-sync loops by only updating local state when the
  // store value actually changes. Many store selectors may return a new
  // object reference on each render, so compare serialized contents.
  const prevVendorJsonRef = useRef<string | null>(null);
  useEffect(() => {
    if (!vendorFromStore) return;
    const json = JSON.stringify(vendorFromStore);
    if (prevVendorJsonRef.current === json) return;
    prevVendorJsonRef.current = json;
    setUpdatedVendor({ ...vendorFromStore });
  }, [vendorFromStore]);

  const handleInputChange = useCallback((name: keyof VendorData, value: string) => {
    setUpdatedVendor((prevVendor) => ({
      ...prevVendor,
      [name]: value,
    }));
  }, []);

  const handleBlur = useCallback(() => {
    if (!id) return;
    const vendorToSave: VendorData = {
      ...updatedVendor,
      name: updatedVendor.name.length === 0 ? vendorFromStore?.name || '' : updatedVendor.name,
    };
    applyVendorUpdates(id, vendorToSave);
  }, [id, updatedVendor, vendorFromStore?.name, applyVendorUpdates]);

  const qbVendorOptions: OptionEntry[] = allVendors
    .filter((vendor) => !!vendor.accountingId)
    .map((vendor) => ({
      label: `${vendor.name}${vendor.address ? ` - ${vendor.address}` : ''}`,
      value: vendor.id,
    }));

  const handleLinkToQbVendor = useCallback(
    (option: OptionEntry) => {
      if (!isQuickBooksAccessible) {
        return;
      }
      const selectedVendor = allVendors.find((vendor) => vendor.id === option.value);
      if (!selectedVendor || !id) {
        setIsLinkVendorPickerVisible(false);
        return;
      }

      setIsLinkVendorPickerVisible(false);
      Alert.alert('Confirm Copy', "Press 'Copy' to copy the customer data from the selected customer.", [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Copy',
          onPress: () => {
            const { id: _selectedId, ...selectedVendorFields } = selectedVendor;
            applyVendorUpdates(id, {
              ...selectedVendorFields,
              inactive: true,
            });
            router.back();
          },
        },
      ]);
    },
    [isQuickBooksAccessible, allVendors, id, applyVendorUpdates, router],
  );

  const handleAddCustomerToQuickBooks = useCallback(() => {
    if (!isQuickBooksAccessible) {
      return;
    }
    if (!id) return;
    if (!orgId || !userId) {
      Alert.alert('Error', 'Missing organization or user information.');
      return;
    }

    Alert.alert('Confirm Add', 'Do you want to add this customer to QuickBooks?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Add',
        onPress: async () => {
          try {
            startProcessing('Adding Vendor to QuickBooks...');
            const response = await addVendor(
              orgId,
              userId,
              {
                name: updatedVendor.name || '',
                mobilePhone: updatedVendor.mobilePhone || updatedVendor.businessPhone || '',
                address: updatedVendor.address || '',
                city: updatedVendor.city || '',
                state: updatedVendor.state || '',
                zip: updatedVendor.zip || '',
                notes: updatedVendor.notes || '',
              },
              getToken,
            );

            if (!response.newQBId) {
              Alert.alert('Error', 'QuickBooks did not return a new vendor ID.');
              return;
            }

            applyVendorUpdates(id, { accountingId: response.newQBId });
            router.back();
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            Alert.alert('Error', `Failed to add customer to QuickBooks: ${message}`);
          } finally {
            stopProcessing();
          }
        },
      },
    ]);
  }, [
    isQuickBooksAccessible,
    id,
    orgId,
    userId,
    updatedVendor,
    getToken,
    applyVendorUpdates,
    startProcessing,
    stopProcessing,
    router,
  ]);

  return (
    <SafeAreaView edges={['right', 'bottom', 'left']} style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Edit Vendor',
          headerBackTitle: '',
          headerBackButtonDisplayMode: 'minimal',
        }}
      />
      <View style={styles.container}>
        <TextInput
          style={[styles.input, { height: 'auto', backgroundColor: colors.neutral200, paddingBottom: 8 }]}
          placeholder="Name"
          value={updatedVendor.name}
          numberOfLines={2}
          multiline
          onChangeText={(text) => handleInputChange('name', text)}
          onBlur={handleBlur}
        />
        <TextInput
          style={[styles.input, { height: 'auto', backgroundColor: colors.neutral200, paddingBottom: 8 }]}
          placeholder="Address"
          value={updatedVendor.address}
          numberOfLines={2}
          multiline
          onChangeText={(text) => handleInputChange('address', text)}
          onBlur={handleBlur}
        />
        <View style={{ flexDirection: 'row' }}>
          <TextInput
            style={[styles.input, { flex: 1, marginRight: 8, backgroundColor: colors.neutral200 }]}
            placeholder="City"
            value={updatedVendor.city}
            onChangeText={(text) => handleInputChange('city', text)}
            onBlur={handleBlur}
          />
          <TextInput
            style={[styles.input, { width: 75, marginRight: 8, backgroundColor: colors.neutral200 }]}
            placeholder="State"
            value={updatedVendor.state}
            onChangeText={(text) => handleInputChange('state', text)}
            onBlur={handleBlur}
          />
          <TextInput
            style={[styles.input, { width: 80, backgroundColor: colors.neutral200 }]}
            placeholder="Zip"
            value={updatedVendor.zip}
            keyboardType="number-pad"
            onChangeText={(text) => handleInputChange('zip', text)}
            onBlur={handleBlur}
          />
        </View>
        <View style={{ flexDirection: 'row' }}>
          <TextInput
            style={[styles.input, { flex: 1, marginRight: 8, backgroundColor: colors.neutral200 }]}
            placeholder="Mobile Phone"
            keyboardType="phone-pad"
            value={updatedVendor.mobilePhone}
            onChangeText={(text) => handleInputChange('mobilePhone', text)}
            onBlur={handleBlur}
          />
          <TextInput
            style={[styles.input, { flex: 1, backgroundColor: colors.neutral200 }]}
            placeholder="Business Phone"
            value={updatedVendor.businessPhone}
            keyboardType="phone-pad"
            onChangeText={(text) => handleInputChange('businessPhone', text)}
            onBlur={handleBlur}
          />
        </View>
        <TextInput
          style={[styles.input, { backgroundColor: colors.neutral200 }]}
          placeholder="Notes"
          value={updatedVendor.notes}
          multiline
          onChangeText={(text) => handleInputChange('notes', text)}
          onBlur={handleBlur}
        />
        {!updatedVendor.accountingId && isQuickBooksAccessible && (
          <View style={styles.actionButtonRow}>
            <ActionButton
              style={styles.linkButton}
              type="action"
              title="Link to QB Vendor"
              onPress={() => setIsLinkVendorPickerVisible(true)}
            />
            <ActionButton
              style={styles.addQbButton}
              type="action"
              title="Add Customer to QuickBooks"
              onPress={handleAddCustomerToQuickBooks}
            />
          </View>
        )}
      </View>
      {isLinkVendorPickerVisible && (
        <BottomSheetContainer
          modalHeight={'80%'}
          isVisible={isLinkVendorPickerVisible}
          onClose={() => setIsLinkVendorPickerVisible(false)}
          showKeyboardToolbar={false}
        >
          <OptionList
            options={qbVendorOptions}
            onSelect={handleLinkToQbVendor}
            enableSearch={qbVendorOptions.length > 15}
          />
        </BottomSheetContainer>
      )}
      <Modal transparent animationType="fade" visible={processingInfo.isProcessing}>
        <View style={styles.processingOverlay}>
          <View style={[styles.processingContainer, { backgroundColor: colors.listBackground }]}>
            <ActivityIndicator size="large" color={colors.tint} />
            <Text style={styles.processingLabel}>{processingInfo.label}</Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 12,
    paddingLeft: 8,
    borderRadius: 4,
  },
  saveButton: {
    flex: 1,
    marginRight: 5,
  },
  actionButtonRow: {
    marginTop: 8,
  },
  linkButton: {
    width: '100%',
  },
  addQbButton: {
    width: '100%',
    marginTop: 8,
  },
  processingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingContainer: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    minWidth: 220,
  },
  processingLabel: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    minWidth: 200,
  },
});

export default EditVendor;
