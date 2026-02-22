import { TextField } from '@/src/components/TextField';
import { Text, View } from '@/src/components/Themed';
import { useColors } from '@/src/context/ColorsContext';
import { CustomerData, useAddRowCallback } from '@/src/tbStores/configurationStore/ConfigurationStoreHooks';
import BottomSheetContainer from '@/src/components/BottomSheetContainer';
import { ActionButton } from '@/src/components/ActionButton';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Keyboard, Platform, Pressable, StyleSheet, TextInput, Alert } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

interface CustomerPickerProps {
  selectedCustomer?: CustomerData;
  onCustomerSelected: (customer: CustomerData) => void;
  customers: CustomerData[];
  label?: string;
  placeholder?: string;
}

export const CustomerPicker = ({
  selectedCustomer,
  onCustomerSelected,
  customers,
  label,
  placeholder = 'Select a customer',
}: CustomerPickerProps) => {
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const [searchText, setSearchText] = useState<string>('');
  const [isAddCustomerModalVisible, setIsAddCustomerModalVisible] = useState(false);
  const [newCustomer, setNewCustomer] = useState<CustomerData>({
    id: '',
    accountingId: '',
    name: '',
    contactName: '',
    email: '',
    phone: '',
    active: true,
  });
  const colors = useColors();
  const addCustomerToStore = useAddRowCallback('customers');

  // Filter to only show active customers
  const activeCustomers = useMemo(() => customers.filter((c) => c.active), [customers]);

  // Filter based on search text
  const filteredCustomers = useMemo(() => {
    if (!searchText.trim()) {
      return activeCustomers;
    }
    const searchLower = searchText.toLowerCase();
    return activeCustomers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(searchLower) ||
        customer.contactName?.toLowerCase().includes(searchLower) ||
        customer.email?.toLowerCase().includes(searchLower),
    );
  }, [activeCustomers, searchText]);

  const handleInputChange = useCallback((name: keyof CustomerData, value: string) => {
    setNewCustomer((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  const handleAddCustomer = useCallback(() => {
    if (!newCustomer.name.trim()) {
      Alert.alert('Error', 'Customer name is required');
      return;
    }

    const result = addCustomerToStore(newCustomer);

    if (result && result.status !== 'Success') {
      Alert.alert('Error', `Failed to add customer: ${result.msg}`);
      return;
    }

    // The new customer was added, select it
    const addedCustomer: CustomerData = {
      ...newCustomer,
      id: result.id || newCustomer.id,
    };

    onCustomerSelected(addedCustomer);

    // Reset state and close both modals
    setNewCustomer({
      id: '',
      accountingId: '',
      name: '',
      contactName: '',
      email: '',
      phone: '',
      active: true,
    });
    setSearchText('');
    setIsAddCustomerModalVisible(false);
  }, [newCustomer, addCustomerToStore, onCustomerSelected]);

  const handleCustomerSelect = useCallback(
    (customer: CustomerData) => {
      onCustomerSelected(customer);
      setIsPickerVisible(false);
      setSearchText('');
    },
    [onCustomerSelected],
  );

  const blurAndOpen = () => {
    const focused = TextInput.State?.currentlyFocusedInput ? TextInput.State.currentlyFocusedInput() : null;
    if (focused && TextInput.State?.blurTextInput) {
      TextInput.State.blurTextInput(focused);
    } else {
      Keyboard.dismiss();
    }
    setIsPickerVisible(true);
  };

  const displayText = selectedCustomer ? selectedCustomer.name : '';

  const handleAddCustomerPress = () => {
    console.log('Add Customer Pressed');
    setIsPickerVisible(false);
    // delay opening the add customer modal to allow the first bottom sheet to close
    setTimeout(() => {
      setIsAddCustomerModalVisible(true);
    }, 300);
  };

  return (
    <>
      <Pressable onPress={blurAndOpen}>
        <View style={styles.pickerRow}>
          <View style={{ flex: 1, backgroundColor: 'transparent' }}>
            <TextField label={label} placeholder={placeholder} value={displayText} editable={false} />
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
        title="Select Customer"
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
                  placeholder="Search customers..."
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
              <Pressable onPress={handleAddCustomerPress}>
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
            data={filteredCustomers}
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
                  selectedCustomer?.id === item.id && {
                    backgroundColor: colors.neutral200,
                  },
                ]}
                onPress={() => handleCustomerSelect(item)}
              >
                <View style={{ paddingHorizontal: 12, paddingVertical: 8 }}>
                  <Text
                    style={[
                      { fontWeight: 500, fontSize: 16 },
                      selectedCustomer?.id === item.id && {
                        fontWeight: 800,
                        fontSize: 16,
                      },
                    ]}
                  >
                    {item.name}
                  </Text>
                  {item.contactName ? (
                    <Text
                      style={{
                        fontSize: 14,
                        color: colors.textMuted,
                        marginTop: 2,
                      }}
                    >
                      {item.contactName}
                    </Text>
                  ) : null}
                </View>
              </Pressable>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text>No active customers found</Text>
              </View>
            }
          />
        </View>
      </BottomSheetContainer>

      <BottomSheetContainer
        isVisible={isAddCustomerModalVisible}
        onClose={() => {
          setIsAddCustomerModalVisible(false);
          setNewCustomer({
            id: '',
            accountingId: '',
            name: '',
            contactName: '',
            email: '',
            phone: '',
            active: true,
          });
        }}
        title="Add New Customer"
        modalHeight="70%"
      >
        <View style={{ padding: 15, backgroundColor: colors.listBackground }}>
          <TextInput
            style={[styles.input, { backgroundColor: colors.neutral200 }]}
            placeholder="Customer Name"
            value={newCustomer.name}
            onChangeText={(text) => handleInputChange('name', text)}
          />
          <TextInput
            style={[styles.input, { backgroundColor: colors.neutral200 }]}
            placeholder="Contact Name"
            value={newCustomer.contactName}
            onChangeText={(text) => handleInputChange('contactName', text)}
          />
          <TextInput
            style={[styles.input, { backgroundColor: colors.neutral200 }]}
            placeholder="Email"
            value={newCustomer.email}
            keyboardType="email-address"
            autoCapitalize="none"
            onChangeText={(text) => handleInputChange('email', text)}
          />
          <TextInput
            style={[styles.input, { backgroundColor: colors.neutral200 }]}
            placeholder="Phone"
            value={newCustomer.phone}
            keyboardType="phone-pad"
            onChangeText={(text) => handleInputChange('phone', text)}
          />
          <ActionButton
            onPress={handleAddCustomer}
            type={newCustomer.name.trim() ? 'action' : 'disabled'}
            title="Add Customer"
          />
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
    borderWidth: 1,
    marginBottom: 10,
    padding: 8,
    borderRadius: 5,
  },
});
