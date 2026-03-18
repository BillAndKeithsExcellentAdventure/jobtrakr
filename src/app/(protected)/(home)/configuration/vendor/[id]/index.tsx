import { ActionButton } from '@/src/components/ActionButton';
import BottomSheetContainer from '@/src/components/BottomSheetContainer';
import OptionList, { OptionEntry } from '@/src/components/OptionList';
import { TextField } from '@/src/components/TextField';
import { Text, View } from '@/src/components/Themed';
import { IOS_KEYBOARD_TOOLBAR_OFFSET } from '@/src/constants/app-constants';
import { useColors } from '@/src/context/ColorsContext';
import { useNetwork } from '@/src/context/NetworkContext';
import { useAppSettings } from '@/src/tbStores/appSettingsStore/appSettingsStoreHooks';
import {
  useAllRows,
  useTypedRow,
  useUpdateRowCallback,
  VendorData,
  VendorDataCompareName,
} from '@/src/tbStores/configurationStore/ConfigurationStoreHooks';
import {
  addVendor,
  grantVendorAccess,
  sendVerificationEmail,
  VendorGrantedAccess,
} from '@/src/utils/quickbooksAPI';
import { useAuth } from '@clerk/clerk-expo';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Platform, StyleSheet, TouchableOpacity } from 'react-native';
import { KeyboardAwareScrollView, KeyboardToolbar } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';

const EditVendor = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { orgId, userId, getToken } = useAuth();
  const appSettings = useAppSettings();

  const { isQuickBooksAccessible, verifiedEmailAddresses, vendorsGrantedAccess, isConnected } = useNetwork();
  const router = useRouter();
  const applyVendorUpdates = useUpdateRowCallback('vendors');
  const allVendors = useAllRows('vendors', VendorDataCompareName);
  const colors = useColors();
  const [isLinkVendorPickerVisible, setIsLinkVendorPickerVisible] = useState(false);
  const [processingInfo, setProcessingInfo] = useState<{ isProcessing: boolean; label: string }>({
    isProcessing: false,
    label: '',
  });
  const [isSendingVerificationEmail, setIsSendingVerificationEmail] = useState(false);
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
    email: '',
    mobilePhone: '',
    businessPhone: '',
    notes: '',
    accountingId: '',
    inactive: false,
    matchCompareString: '',
  });

  const isGrantedAccess = false; // TODO: Implement access control and replace with actual permission check

  const isEmailVerified = useMemo(
    () => (updatedVendor.email && isConnected ? verifiedEmailAddresses.includes(updatedVendor.email) : false),
    [updatedVendor.email, isConnected, verifiedEmailAddresses],
  );

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
      Alert.alert('Confirm Copy', "Press 'Copy' to copy the vendor data from the selected vendor.", [
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

  const grantVendorAccessRequest = useMemo(() => {
    if (!updatedVendor.email || !orgId || !userId || !updatedVendor.accountingId || !updatedVendor.name)
      return null;
    return {
      orgId,
      userId,
      vendorEmail: updatedVendor.email,
      vendorId: updatedVendor.accountingId || '', // accountingId is used as a proxy for vendor ID in QuickBooks, but this may need to be adjusted based on actual data structure
      vendorName: updatedVendor.name,
      organizationName: appSettings.companyName || '',
      fromEmail: appSettings.email || '',
      fromName: appSettings.ownerName || '',
    };
  }, [
    updatedVendor.email,
    updatedVendor.accountingId,
    updatedVendor.name,
    appSettings.email,
    appSettings.ownerName,
    appSettings.companyName,
    orgId,
    userId,
  ]);

  const vendorAccess: VendorGrantedAccess | undefined = useMemo(() => {
    if (updatedVendor.email && isConnected) {
      return vendorsGrantedAccess.find((v) => v.vendor_email === updatedVendor.email);
    }
    return undefined;
  }, [updatedVendor.email, isConnected, vendorsGrantedAccess]);

  const handleAddVendorToQuickBooks = useCallback(() => {
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
                email: updatedVendor.email || '',
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
    <>
      <SafeAreaView edges={['right', 'bottom', 'left']} style={{ flex: 1 }}>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Edit Vendor',
            headerBackTitle: '',
            headerBackButtonDisplayMode: 'minimal',
          }}
        />
        <KeyboardAwareScrollView
          bottomOffset={IOS_KEYBOARD_TOOLBAR_OFFSET + 52}
          keyboardShouldPersistTaps="handled"
          style={{ flex: 1, backgroundColor: colors.background }}
          contentContainerStyle={[
            styles.container,
            { backgroundColor: colors.background, paddingBottom: Platform.OS === 'ios' ? 90 : 24 },
          ]}
        >
          <TextField
            placeholder="Name"
            label="Name"
            value={updatedVendor.name}
            numberOfLines={2}
            multiline
            onChangeText={(text) => handleInputChange('name', text)}
            onBlur={handleBlur}
          />
          <TextField
            placeholder="Match Pattern (e.g. lowe*s)"
            label="Match Pattern for Photo Processing"
            value={updatedVendor.matchCompareString}
            onChangeText={(text) => handleInputChange('matchCompareString', text)}
            onBlur={handleBlur}
          />
          <TextField
            placeholder="Address"
            label="Address"
            value={updatedVendor.address}
            numberOfLines={2}
            multiline
            onChangeText={(text) => handleInputChange('address', text)}
            onBlur={handleBlur}
          />
          <View style={{ flexDirection: 'row', gap: 8, alignSelf: 'stretch' }}>
            <TextField
              placeholder="City"
              label="City"
              containerStyle={{ flex: 1 }}
              value={updatedVendor.city}
              onChangeText={(text) => handleInputChange('city', text)}
              onBlur={handleBlur}
            />
            <TextField
              placeholder="State"
              label="State"
              containerStyle={{ width: 80 }}
              value={updatedVendor.state}
              onChangeText={(text) => handleInputChange('state', text)}
              onBlur={handleBlur}
            />
            <TextField
              placeholder="Zip"
              label="Zip"
              containerStyle={{ width: 80 }}
              value={updatedVendor.zip}
              keyboardType="number-pad"
              onChangeText={(text) => handleInputChange('zip', text)}
              onBlur={handleBlur}
            />
          </View>
          <View style={{ flexDirection: 'row', gap: 8, alignSelf: 'stretch' }}>
            <TextField
              placeholder="Mobile Phone"
              label="Mobile Phone"
              keyboardType="phone-pad"
              containerStyle={{ flex: 1 }}
              value={updatedVendor.mobilePhone}
              onChangeText={(text) => handleInputChange('mobilePhone', text)}
              onBlur={handleBlur}
            />
            <TextField
              placeholder="Business Phone"
              label="Business Phone"
              containerStyle={{ flex: 1 }}
              value={updatedVendor.businessPhone}
              keyboardType="phone-pad"
              onChangeText={(text) => handleInputChange('businessPhone', text)}
              onBlur={handleBlur}
            />
          </View>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <TextField
              containerStyle={{ flex: 1 }}
              placeholder="Email"
              label="Email"
              value={updatedVendor.email}
              keyboardType="email-address"
              autoCapitalize="none"
              onChangeText={(text) => handleInputChange('email', text)}
              onBlur={handleBlur}
            />
            {isEmailVerified ? (
              <View
                style={{
                  flexDirection: 'row',
                  gap: 8,
                  alignItems: 'flex-end',
                  alignSelf: 'flex-end',
                  paddingBottom: 8,
                }}
              >
                <MaterialIcons name="verified-user" size={28} color={colors.profitFg} />
                {vendorAccess ? (
                  <MaterialCommunityIcons
                    name="shield-key"
                    size={28}
                    color={vendorAccess.isRegistered ? colors.profitFg : colors.textMuted}
                  />
                ) : (
                  <>
                    {isQuickBooksAccessible && grantVendorAccessRequest && (
                      <TouchableOpacity
                        onPress={async () => {
                          if (isSendingVerificationEmail) {
                            return;
                          }

                          setIsSendingVerificationEmail(true);
                          try {
                            await grantVendorAccess(orgId!, userId!, grantVendorAccessRequest, getToken);
                            Alert.alert(
                              'Access Granted',
                              'Vendor access has been granted. Please ask them to check their inbox and click the verification link.',
                            );
                          } catch (error) {
                            console.error('Error granting vendor access:', error);
                            Alert.alert(
                              'Error',
                              'There was an error granting vendor access. Please try again later.',
                            );
                          } finally {
                            setIsSendingVerificationEmail(false);
                          }
                        }}
                        disabled={isSendingVerificationEmail}
                        style={{
                          backgroundColor: colors.buttonBlue,
                          borderRadius: 4,
                          alignSelf: 'flex-end',
                          paddingVertical: 8,
                          paddingHorizontal: 12,
                          opacity: isSendingVerificationEmail ? 0.7 : 1,
                        }}
                      >
                        <Text style={{ color: '#fff' }} text="Grant" />
                        <Text style={{ color: '#fff' }} text="Access" />
                      </TouchableOpacity>
                    )}
                  </>
                )}
              </View>
            ) : (
              <>
                {updatedVendor.email && updatedVendor.email.trim().length > 0 && (
                  <TouchableOpacity
                    onPress={async () => {
                      if (isSendingVerificationEmail) {
                        return;
                      }

                      setIsSendingVerificationEmail(true);
                      try {
                        await sendVerificationEmail(orgId!, userId!, updatedVendor.email!, getToken);
                        Alert.alert(
                          'Verification Email Sent',
                          'A verification email has been sent to vendor. Please ask them to check their inbox and click the verification link.',
                        );
                      } catch (error) {
                        console.error('Error sending verification email:', error);
                        Alert.alert(
                          'Error',
                          'There was an error sending the verification email. Please try again later.',
                        );
                      } finally {
                        setIsSendingVerificationEmail(false);
                      }
                    }}
                    disabled={isSendingVerificationEmail}
                    style={{
                      backgroundColor: colors.buttonBlue,
                      borderRadius: 4,
                      alignSelf: 'flex-end',
                      paddingVertical: 8,
                      paddingHorizontal: 12,
                      opacity: isSendingVerificationEmail ? 0.7 : 1,
                    }}
                  >
                    <Text style={{ color: '#fff' }} text="Verify" />
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
          <TextField
            placeholder="Notes"
            label="Notes"
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
                title="Link to QuickBooks Vendor"
                onPress={() => setIsLinkVendorPickerVisible(true)}
              />
              <ActionButton
                style={styles.addQbButton}
                type="action"
                title="Add Vendor to QuickBooks"
                onPress={handleAddVendorToQuickBooks}
              />
            </View>
          )}
        </KeyboardAwareScrollView>
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
      {Platform.OS === 'ios' && <KeyboardToolbar offset={{ opened: IOS_KEYBOARD_TOOLBAR_OFFSET }} />}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 8,
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
