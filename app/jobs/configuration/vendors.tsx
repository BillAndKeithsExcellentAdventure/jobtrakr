import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const VendorsScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Vendors List</Text>
      {/* You can render a list of vendors here */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default VendorsScreen;
