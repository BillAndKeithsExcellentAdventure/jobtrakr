import { Text, View } from '@/components/Themed';
import React from 'react';

const home = () => {
  return (
    <View style={{ flex: 1, alignItems: 'center', padding: 40 }}>
      <Text txtSize="title" text="Job+" style={{ marginBottom: 5 }} />
      <Text txtSize="normal" text="version 1.0.1" style={{ marginBottom: 20 }} />
      <Text
        txtSize="sub-title"
        text="Please use the menu icon in top left to select the item you want to configure."
      />
    </View>
  );
};

export default home;
