/** *
Sample list for web
 */
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, FlatList, Platform } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { JobSummary } from '@/models/jobSummary';

import { useColorScheme } from '@/components/useColorScheme';
import { formatDate, formatCurrency } from '@/utils/formatters';
import { router } from 'expo-router';
import { push } from 'expo-router/build/global-state/routing';

export function JobList({ data }: { data: JobSummary[] }) {
  const [height, setHeight] = useState(100);
  const colorScheme = useColorScheme();
  let showsVerticalScrollIndicator = false;
  if (Platform.OS === 'web') {
    showsVerticalScrollIndicator = true;
  }

  // Define colors based on the color scheme (dark or light)
  const colors =
    colorScheme === 'dark'
      ? {
          background: '#333',
          title: '#fff',
          subtitle: '#bbb',
          itemBackground: '#444',
        }
      : {
          background: '#fff',
          title: '#000',
          subtitle: '#555',
          itemBackground: '#f9f9f9',
        };

  const renderItem = ({ item }: { item: JobSummary }) => (
    <Pressable
      onPress={() => router.push(`/(tabs)/job/${item.jobId}?jobName=${item.name}`)}
      style={{ height, width: '100%' }}
    >
      <View style={[styles.itemContainer, { backgroundColor: colors.itemBackground }]}>
        {/* Row for Title */}
        <View style={styles.titleRow}>
          <Text style={[styles.titleText, { color: colors.title }]}>
            {item.name}
          </Text>
          <Text style={[styles.subtitleText, { color: colors.subtitle }]}>{formatDate(item.plannedFinish)}</Text>
        </View>

        {/* Row for Subtitles */}
        <View style={styles.subtitleRow}>
          <View style={styles.subtitleColumn}>
            <Text style={[styles.subtitleTextLeft, { color: colors.subtitle }]}>{`bid: ${formatCurrency(
              item.bidPrice
            )}`}</Text>
          </View>
          <View style={styles.subtitleColumn}>
            <Text style={[styles.subtitleTextRight, { color: colors.subtitle }]}>{`spent: ${formatCurrency(
              item.spentToDate
            )}`}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        maxWidth: 600,
        paddingHorizontal: 10,
      }}
    >
      <FlatList
        style={[styles.flatList, { backgroundColor: colors.background }]}
        data={data}
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        keyExtractor={(item) => item.name.toString()}
        renderItem={renderItem}
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
  flatList: {
    flex: 1,
    padding: 10,
    width: '100%',
  },
  itemContainer: {
    marginBottom: 20,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 15,
    elevation: 3, // Adds shadow effect for Android
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  titleText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitleRow: {
    flexDirection: 'row',
  },
  subtitleColumn: {
    flex: 1,
  },
  subtitleText: {
    fontSize: 14,
    color: '#666',
  },
  subtitleTextLeft: {
    fontSize: 14,
    color: '#666',
    textAlign: 'left',
  },
  subtitleTextRight: {
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
  },
});
