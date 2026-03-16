import { ActionButton } from '@/src/components/ActionButton';
import BottomSheetContainer from '@/src/components/BottomSheetContainer';
import OptionList, { OptionEntry } from '@/src/components/OptionList';
import { Text, View } from '@/src/components/Themed';
import { Switch } from '@/src/components/Switch';
import { useColors } from '@/src/context/ColorsContext';
import {
  CustomerData,
  CustomerDataCompareName,
  useAllRows,
  useTypedRow,
  useUpdateRowCallback,
} from '@/src/tbStores/configurationStore/ConfigurationStoreHooks';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { StyledHeaderBackButton } from '@/src/components/StyledHeaderBackButton';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Platform, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextField } from '@/src/components/TextField';
import { KeyboardAwareScrollView, KeyboardToolbar } from 'react-native-keyboard-controller';
import { IOS_KEYBOARD_TOOLBAR_OFFSET } from '@/src/constants/app-constants';
import { useNetwork } from '@/src/context/NetworkContext';
import { useAuth } from '@clerk/clerk-expo';
import {
  addCustomer,
  QBEditCustomerInfo,
  sendVerificationEmail,
  updateCustomer,
} from '@/src/utils/quickbooksAPI';
import { MaterialIcons } from '@expo/vector-icons';

const EditCustomer = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isQuickBooksAccessible, verifiedEmailAddresses, isConnected } = useNetwork();
  const { orgId, userId, getToken } = useAuth();

  const applyCustomerUpdates = useUpdateRowCallback('customers');
  const allCustomers = useAllRows('customers', CustomerDataCompareName);
  const colors = useColors();
  const [isLinkCustomerPickerVisible, setIsLinkCustomerPickerVisible] = useState(false);
  const [processingInfo, setProcessingInfo] = useState<{ isProcessing: boolean; label: string }>({
    isProcessing: false,
    label: '',
  });
  const startProcessing = useCallback(
    (label: string) => setProcessingInfo({ isProcessing: true, label }),
    [],
  );
  const stopProcessing = useCallback(() => setProcessingInfo({ isProcessing: false, label: '' }), []);
  const [updatedCustomer, setUpdatedCustomer] = useState<CustomerData>({
    id: '',
    accountingId: '',
    name: '',
    contactName: '',
    email: '',
    phone: '',
    inactive: false,
  });

  const customerFromStore = useTypedRow('customers', id);

  const prevCustomerJsonRef = useRef<string | null>(null);
  useEffect(() => {
    if (!customerFromStore) return;
    const json = JSON.stringify(customerFromStore);
    if (prevCustomerJsonRef.current === json) return;
    prevCustomerJsonRef.current = json;
    setUpdatedCustomer({ ...customerFromStore });
  }, [customerFromStore]);

  const isFromQuickBooks = Boolean(updatedCustomer.accountingId);

  const isEmailVerified = useMemo(
    () =>
      updatedCustomer.email && isConnected ? verifiedEmailAddresses.includes(updatedCustomer.email) : true,
    [updatedCustomer.email, isConnected, verifiedEmailAddresses],
  );

  const qbCustomerOptions: OptionEntry[] = allCustomers
    .filter((customer) => !!customer.accountingId && customer.id !== id)
    .map((customer) => ({
      label: customer.contactName ? `${customer.name} - ${customer.contactName}` : customer.name,
      value: customer.id,
    }));

  const handleInputChange = useCallback((name: keyof CustomerData, value: string) => {
    setUpdatedCustomer((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  const handleBackPress = useCallback(() => {
    if (id) {
      applyCustomerUpdates(id, updatedCustomer);

      if (isQuickBooksAccessible && updatedCustomer.accountingId && orgId) {
        // If the customer is connected to QuickBooks, we want to make sure any updates are sent to QuickBooks.
        // We do not want to await this call, as it could delay the navigation back, but we do want to trigger it before navigating back to ensure the most up-to-date data is sent to QuickBooks.
        (async () => {
          try {
            const nameParts = updatedCustomer.contactName
              ? updatedCustomer.contactName.split(' ')
              : updatedCustomer.name.split(' ');
            const firstName = nameParts[0];
            const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

            const qbCustomer: QBEditCustomerInfo = {
              customerId: updatedCustomer.accountingId,
              displayName: updatedCustomer.contactName || updatedCustomer.name,
              firstName,
              lastName,
              address: '',
              address2: '',
              city: '',
              state: '',
              zip: '',
              email: updatedCustomer.email,
              phone: updatedCustomer.phone,
            };

            await updateCustomer(orgId, userId, qbCustomer, getToken);
          } catch (error) {
            console.error('Error updating customer in QuickBooks:', error);
          }
        })();
      }
    }
    router.back();
  }, [id, updatedCustomer, applyCustomerUpdates, router, isQuickBooksAccessible, orgId, userId, getToken]);

  const handleToggleActive = useCallback(() => {
    const newInactive = !updatedCustomer.inactive;
    setUpdatedCustomer((prev) => ({ ...prev, inactive: newInactive }));
    if (id) {
      applyCustomerUpdates(id, { inactive: newInactive });
    }
  }, [id, updatedCustomer.inactive, applyCustomerUpdates]);

  const handleLinkToQbCustomer = useCallback(
    (option: OptionEntry) => {
      if (!isQuickBooksAccessible) {
        return;
      }
      const selectedCustomer = allCustomers.find((customer) => customer.id === option.value);
      if (!selectedCustomer || !id) {
        setIsLinkCustomerPickerVisible(false);
        return;
      }

      setIsLinkCustomerPickerVisible(false);
      Alert.alert('Confirm Copy', "Press 'Copy' to copy the customer data from the selected customer.", [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Copy',
          onPress: () => {
            const { id: _selectedId, ...selectedCustomerFields } = selectedCustomer;
            applyCustomerUpdates(id, selectedCustomerFields);
            router.back();
          },
        },
      ]);
    },
    [isQuickBooksAccessible, allCustomers, id, applyCustomerUpdates, router],
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
            startProcessing('Adding Customer to QuickBooks...');
            const nameParts = updatedCustomer.contactName
              ? updatedCustomer.contactName.split(' ')
              : updatedCustomer.name.split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

            const response = await addCustomer(
              orgId,
              userId,
              {
                displayName: updatedCustomer.name || '',
                firstName,
                lastName,
                email: updatedCustomer.email || '',
                phone: updatedCustomer.phone || '',
                address: '',
                address2: '',
                city: '',
                state: '',
                zip: '',
              },
              getToken,
            );

            if (!response.newQBId) {
              Alert.alert('Error', 'QuickBooks did not return a new customer ID.');
              return;
            }

            applyCustomerUpdates(id, { accountingId: response.newQBId });
            setUpdatedCustomer((prev) => ({ ...prev, accountingId: response.newQBId || prev.accountingId }));
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
    updatedCustomer,
    getToken,
    applyCustomerUpdates,
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
            title: 'Edit Customer',
            headerBackTitle: '',
            headerBackButtonDisplayMode: 'minimal',
            headerLeft: () => <StyledHeaderBackButton onPress={handleBackPress} />,
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
          {isFromQuickBooks && (
            <Text
              txtSize="xs"
              text="This customer is connected to a customer in QuickBooks. Only the Contact Name, email, and the Active status can be edited."
              style={{ marginBottom: 12, color: colors.neutral500 }}
            />
          )}
          <TextField
            containerStyle={styles.inputContainer}
            style={[styles.input]}
            label="Customer Name"
            placeholder="Customer Name"
            value={updatedCustomer.name}
            onChangeText={(text) => handleInputChange('name', text)}
            editable={!isFromQuickBooks}
          />
          <TextField
            containerStyle={styles.inputContainer}
            style={[styles.input]}
            label="Contact Name"
            placeholder="Contact Name"
            value={updatedCustomer.contactName}
            onChangeText={(text) => handleInputChange('contactName', text)}
          />
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <TextField
              containerStyle={[styles.inputContainer, { flex: 1 }]}
              style={[styles.input]}
              label="Email"
              placeholder="Email"
              value={updatedCustomer.email}
              keyboardType="email-address"
              autoCapitalize="none"
              onChangeText={(text) => handleInputChange('email', text)}
            />
            {isEmailVerified ? (
              <MaterialIcons name="verified-user" size={28} color={colors.profitFg} />
            ) : (
              <>
                {updatedCustomer.email && updatedCustomer.email.trim().length > 0 && (
                  <TouchableOpacity
                    onPress={async () => {
                      try {
                        await sendVerificationEmail(orgId!, userId!, updatedCustomer.email!, getToken);
                        Alert.alert(
                          'Verification Email Sent',
                          'A verification email has been sent to customer. Please ask them to check their inbox and click the verification link.',
                        );
                      } catch (error) {
                        console.error('Error sending verification email:', error);
                        Alert.alert(
                          'Error',
                          'There was an error sending the verification email. Please try again later.',
                        );
                      }
                    }}
                    style={{
                      backgroundColor: colors.buttonBlue,
                      borderRadius: 4,
                      alignSelf: 'flex-end',
                      paddingVertical: 8,
                      paddingHorizontal: 12,
                    }}
                  >
                    <Text style={{ color: '#fff' }} text="Verify" />
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
          <TextField
            style={[styles.input]}
            label="Phone"
            placeholder="Phone"
            value={updatedCustomer.phone}
            keyboardType="phone-pad"
            onChangeText={(text) => handleInputChange('phone', text)}
            editable={!isFromQuickBooks}
          />
          <View style={styles.activeRow}>
            <Text txtSize="standard" text="Active" />
            <Switch value={!updatedCustomer.inactive} onValueChange={handleToggleActive} size="medium" />
          </View>
          {!updatedCustomer.accountingId && isQuickBooksAccessible && (
            <View style={styles.actionButtonRow}>
              <ActionButton
                style={styles.linkButton}
                type="action"
                title="Link to QuickBooks Customer"
                onPress={() => setIsLinkCustomerPickerVisible(true)}
              />
              <ActionButton
                style={styles.addQbButton}
                type="action"
                title="Add Customer to QuickBooks"
                onPress={handleAddCustomerToQuickBooks}
              />
            </View>
          )}
        </KeyboardAwareScrollView>
      </SafeAreaView>
      {isLinkCustomerPickerVisible && (
        <BottomSheetContainer
          modalHeight={'80%'}
          isVisible={isLinkCustomerPickerVisible}
          onClose={() => setIsLinkCustomerPickerVisible(false)}
          showKeyboardToolbar={false}
        >
          <OptionList
            options={qbCustomerOptions}
            onSelect={handleLinkToQbCustomer}
            enableSearch={qbCustomerOptions.length > 15}
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
      {Platform.OS === 'ios' && <KeyboardToolbar offset={{ opened: IOS_KEYBOARD_TOOLBAR_OFFSET }} />}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 8,
  },
  inputContainer: {
    marginTop: 0, // use gap instead
  },
  input: {
    borderRadius: 4,
  },
  activeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
    gap: 20,
    paddingHorizontal: 4,
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

export default EditCustomer;
