import { ModalScreenContainer } from '@/src/components/ModalScreenContainer';
import { Text, TextInput, View } from '@/src/components/Themed';
import { useColors } from '@/src/context/ColorsContext';
import { useNetwork } from '@/src/context/NetworkContext';
import {
  useAddRowCallback,
  useUpdateRowCallback,
  VendorData,
} from '@/src/tbStores/configurationStore/ConfigurationStoreHooks';
import { addVendor } from '@/src/utils/quickbooksAPI';
import { useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Modal, StyleSheet } from 'react-native';

const AddVendorModal = () => {
  const router = useRouter();
  const colors = useColors();
  const addVendorToStore = useAddRowCallback('vendors');
  const updateVendorInStore = useUpdateRowCallback('vendors');
  const { isQuickBooksAccessible } = useNetwork();
  const { orgId, userId, getToken } = useAuth();
  const [processingInfo, setProcessingInfo] = useState<{ isProcessing: boolean; label: string }>({
    isProcessing: false,
    label: '',
  });

  const startProcessing = useCallback(
    (label: string) => setProcessingInfo({ isProcessing: true, label }),
    [],
  );
  const stopProcessing = useCallback(() => setProcessingInfo({ isProcessing: false, label: '' }), []);
  const [vendor, setVendor] = useState<VendorData>({
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
    matchCompareString: '',
  });

  const handleInputChange = useCallback((name: keyof VendorData, value: string) => {
    setVendor((prevVendor) => ({
      ...prevVendor,
      [name]: value,
    }));
  }, []);

  const handleSave = useCallback(() => {
    const result = addVendorToStore(vendor);

    if (result && result.status !== 'Success') {
      console.error('Failed to add vendor:', result ? result.msg : 'Unknown error');
      return;
    }

    if (!isQuickBooksAccessible) {
      router.back();
      return;
    }

    Alert.alert('Confirm Add', 'Do you want to add this customer to QuickBooks?', [
      {
        text: 'Skip',
        style: 'cancel',
        onPress: () => {
          router.back();
        },
      },
      {
        text: 'Add',
        onPress: async () => {
          try {
            startProcessing('Adding Vendor to QuickBooks...');
            if (!orgId || !userId || !result?.id) {
              router.back();
              return;
            }

            const response = await addVendor(
              orgId,
              userId,
              {
                name: vendor.name || '',
                mobilePhone: vendor.mobilePhone || vendor.businessPhone || '',
                address: vendor.address || '',
                city: vendor.city || '',
                state: vendor.state || '',
                zip: vendor.zip || '',
                notes: vendor.notes || '',
              },
              getToken,
            );

            if (response.newQBId) {
              updateVendorInStore(result.id, { accountingId: response.newQBId });
            }
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            Alert.alert('Error', `Failed to add customer to QuickBooks: ${message}`);
          } finally {
            stopProcessing();
            router.back();
          }
        },
      },
    ]);
  }, [
    addVendorToStore,
    vendor,
    isQuickBooksAccessible,
    orgId,
    userId,
    getToken,
    updateVendorInStore,
    startProcessing,
    stopProcessing,
    router,
  ]);

  const canSave = vendor.name.length > 0;

  return (
    <View style={{ flex: 1, width: '100%' }}>
      <ModalScreenContainer
        title="Add Vendor/Merchant"
        onSave={handleSave}
        onCancel={() => router.back()}
        canSave={canSave}
      >
        <TextInput
          style={[styles.input, { backgroundColor: colors.neutral200 }]}
          placeholder="Vendor/Merchant Name"
          value={vendor.name}
          onChangeText={(text) => handleInputChange('name', text)}
        />
        <TextInput
          style={[styles.input, { backgroundColor: colors.neutral200 }]}
          placeholder="Match Pattern (e.g. home?depot or home*depot)"
          value={vendor.matchCompareString}
          onChangeText={(text) => handleInputChange('matchCompareString', text)}
        />
        <TextInput
          style={[styles.input, { backgroundColor: colors.neutral200 }]}
          placeholder="Address"
          value={vendor.address}
          onChangeText={(text) => handleInputChange('address', text)}
        />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput
            style={[styles.input, { flex: 1, backgroundColor: colors.neutral200 }]}
            placeholder="City"
            value={vendor.city}
            onChangeText={(text) => handleInputChange('city', text)}
          />
          <TextInput
            style={[styles.input, { width: 75, backgroundColor: colors.neutral200 }]}
            placeholder="State"
            value={vendor.state}
            onChangeText={(text) => handleInputChange('state', text)}
          />
          <TextInput
            style={[styles.input, { width: 80, backgroundColor: colors.neutral200 }]}
            placeholder="Zip"
            value={vendor.zip}
            keyboardType="number-pad"
            onChangeText={(text) => handleInputChange('zip', text)}
          />
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput
            style={[styles.input, { flex: 1, backgroundColor: colors.neutral200 }]}
            placeholder="Mobile Phone"
            keyboardType="phone-pad"
            value={vendor.mobilePhone}
            onChangeText={(text) => handleInputChange('mobilePhone', text)}
          />
          <TextInput
            style={[styles.input, { flex: 1, backgroundColor: colors.neutral200 }]}
            placeholder="Business Phone"
            value={vendor.businessPhone}
            keyboardType="phone-pad"
            onChangeText={(text) => handleInputChange('businessPhone', text)}
          />
        </View>
        <TextInput
          style={[styles.input, { backgroundColor: colors.neutral200 }]}
          placeholder="Notes"
          value={vendor.notes}
          multiline
          onChangeText={(text) => handleInputChange('notes', text)}
        />
      </ModalScreenContainer>
      <Modal transparent animationType="fade" visible={processingInfo.isProcessing}>
        <View style={styles.processingOverlay}>
          <View style={[styles.processingContainer, { backgroundColor: colors.listBackground }]}>
            <ActivityIndicator size="large" color={colors.tint} />
            <Text style={styles.processingLabel}>{processingInfo.label}</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  modalTitle: {
    marginBottom: 15,
    textAlign: 'center',
  },
  input: {
    height: 40,
    borderWidth: 1,
    marginBottom: 10,
    paddingLeft: 10,
    borderRadius: 4,
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
  },
});

export default AddVendorModal;
