import { View, Text } from 'react-native';
import React from 'react';
import { Drawer } from 'expo-router/drawer';

const _layout = () => {
  return (
    <Drawer initialRouteName="home">
      <Drawer.Screen name="home" options={{ title: 'Configuration Home', drawerLabel: 'Home' }} />
      <Drawer.Screen name="categories" options={{ title: 'Categories' }} />
      <Drawer.Screen name="vendors" options={{ title: 'Vendors' }} />
    </Drawer>
  );
};

export default _layout;
