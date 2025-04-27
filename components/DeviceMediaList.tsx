import React, { useCallback } from 'react';
import { View, TouchableOpacity, Image, ActivityIndicator, StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/Themed';
import { ActionButton } from '@/components/ActionButton';
import * as MediaLibrary from 'expo-media-library';

export type AssetsItem = {
  _id: string;
  selected: boolean;
  asset: MediaLibrary.Asset;
};

interface DeviceMediaListProps {
  mediaAssets?: AssetsItem[];
  hasSelectedAssets: boolean;
  loadingNearest: boolean;
  fetchStatus: string;
  onSelectItem: (id: string) => void;
  onImagePress: (uri: string, type: 'video' | 'photo', photoDate: string) => void;
  onSelectAll: () => void;
  onImport: () => void;
  onClose: () => void;
  onLoadMore: () => void;
  useProjectLocation: boolean;
  getAddButtonTitle: () => string;
}

export const DeviceMediaList = ({
  mediaAssets,
  hasSelectedAssets,
  loadingNearest,
  fetchStatus,
  onSelectItem,
  onImagePress,
  onSelectAll,
  onImport,
  onClose,
  onLoadMore,
  useProjectLocation,
  getAddButtonTitle,
}: DeviceMediaListProps) => {
  const renderItem = useCallback(
    ({ item }: { item: AssetsItem }) => {
      const photoDate = new Date(item.asset.creationTime * 1).toLocaleString();
      return (
        <View style={styles.assetContainer}>
          <TouchableOpacity
            style={[styles.imageContainer, item.selected && styles.imageSelected]}
            onPress={() => onSelectItem(item.asset.id)}
            onLongPress={() =>
              onImagePress(item.asset.uri, item.asset.mediaType as 'photo' | 'video', photoDate)
            }
          >
            <View>
              <Image source={{ uri: item.asset.uri }} style={styles.thumbnail} />
              <Text style={styles.dateOverlay}>{photoDate}</Text>
              {item.asset.mediaType === 'video' && (
                <View style={styles.playButtonOverlay}>
                  <Ionicons name="play" size={30} color="white" />
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>
      );
    },
    [onSelectItem, onImagePress],
  );

  const renderFooter = useCallback(
    () => (
      <View style={styles.footer}>
        {!useProjectLocation && <ActionButton title="Load More" onPress={onLoadMore} type="action" />}
      </View>
    ),
    [useProjectLocation, onLoadMore],
  );

  return (
    <View style={styles.listColumn}>
      <Text style={styles.listTitle}>Photos</Text>
      {loadingNearest ? (
        <View style={styles.loadingContainer}>
          <Text>Loading...{fetchStatus}</Text>
          <ActivityIndicator size="large" color="#007AFF" style={styles.loadingIndicator} />
        </View>
      ) : (
        <>
          <View style={styles.selectRow}>
            <TouchableOpacity onPress={onSelectAll}>
              <Ionicons
                name={hasSelectedAssets ? 'ellipse-sharp' : 'ellipse-outline'}
                size={24}
                color="#007AFF"
              />
            </TouchableOpacity>
            {hasSelectedAssets && (
              <Text>{mediaAssets?.filter((asset) => asset.selected).length} selected</Text>
            )}
          </View>

          <FlashList
            data={mediaAssets}
            estimatedItemSize={200}
            ListFooterComponent={renderFooter}
            renderItem={renderItem}
          />

          <View style={styles.buttonContainer}>
            <View style={styles.buttonRow}>
              {(useProjectLocation || (!useProjectLocation && hasSelectedAssets)) && (
                <View style={styles.buttonWrapper}>
                  <ActionButton type="action" title={getAddButtonTitle()} onPress={onImport} />
                </View>
              )}
              <View style={styles.buttonWrapper}>
                <ActionButton title="Close" onPress={onClose} type="action" />
              </View>
            </View>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  listTitle: {
    textAlign: 'center',
  },
  thumbnail: {
    flex: 1,
    height: 200,
    borderRadius: 8,
  },
  buttonContainer: {
    marginTop: 10,
  },
  selectRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  buttonWrapper: {
    flex: 1,
  },
  assetContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  imageSelected: {
    borderColor: '#007AFF',
  },
  listColumn: {
    flex: 1,
    padding: 10,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
  },
  loadingIndicator: {
    marginTop: 10,
  },
  footer: {
    padding: 10,
    alignItems: 'center',
  },
  imageContainer: {
    position: 'relative',
    flex: 1,
    marginBottom: 10,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  dateOverlay: {
    position: 'absolute',
    bottom: 10,
    right: 60,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    color: 'white',
    padding: 5,
    borderRadius: 4,
    fontSize: 12,
  },
  playButtonOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -20 }, { translateY: -20 }],
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 25,
    padding: 10,
  },
});
