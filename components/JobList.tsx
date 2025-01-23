/** *
Sample list for web
 */
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, FlatList } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { JobSummary } from '@/models/jobSummary';

export function JobList({ data }: { data: JobSummary[] }) {
  const [height, setHeight] = useState(100);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%', paddingHorizontal: 20 }}>
      <FlatList
        style={{ width: '100%' }}
        data={data}
        showsVerticalScrollIndicator={false}
        keyExtractor={(item) => item.name.toString()}
        renderItem={({ item }) => (
          <Pressable onPress={() => console.log('Pressed:', item.name)} style={{ height, width: '100%' }}>
            <View style={styles.container}>
              <Text style={{ color: 'black', fontSize: 22 }}>{item.name}</Text>
              <View
                style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginVertical: 20 }}
              >
                <Text style={{ color: 'black', fontSize: 16 }}>$450390</Text>
                <Text style={{ color: 'black', fontSize: 16 }}>$290150</Text>
              </View>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'cyan',
    borderWidth: 2,
    borderRadius: 20,
    borderColor: 'white',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
  },
});
