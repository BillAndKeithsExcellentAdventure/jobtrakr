import { TextField } from '@/src/components/TextField';
import { Text, View } from '@/src/components/Themed';
import { useColors } from '@/src/context/ColorsContext';
import { CustomerData } from '@/src/tbStores/configurationStore/ConfigurationStoreHooks';
import BottomSheetContainer from '@/src/components/BottomSheetContainer';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Keyboard, Platform, Pressable, StyleSheet, TextInput } from 'react-native';
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
  const colors = useColors();

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

  const displayText = selectedCustomer
    ? `${selectedCustomer.name}${selectedCustomer.contactName ? ` (${selectedCustomer.contactName})` : ''}`
    : '';

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
          <View style={[styles.searchContainer, { borderBottomColor: colors.border }]}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                borderWidth: 1,
                borderRadius: 8,
                paddingLeft: 10,
                paddingRight: 5,
                borderColor: colors.border,
                justifyContent: 'space-between',
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
                    paddingHorizontal: 15,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                    justifyContent: 'center',
                    minHeight: 60,
                    paddingVertical: 10,
                  },
                  selectedCustomer?.id === item.id && {
                    backgroundColor: colors.neutral200,
                  },
                ]}
                onPress={() => handleCustomerSelect(item)}
              >
                <View>
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
                  {item.email ? (
                    <Text
                      style={{
                        fontSize: 12,
                        color: colors.textMuted,
                        marginTop: 2,
                      }}
                    >
                      {item.email}
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
});
