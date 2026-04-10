import React, { useCallback, useMemo } from 'react';
import { Dimensions, FlatList, Platform, RefreshControl, StyleSheet } from 'react-native';
import ImageCard from '@/components/ImageCard';
import type { GalleryImage } from '@gallery/shared';

const SCREEN_WIDTH = Dimensions.get('window').width;
const NUM_COLUMNS = 2;
const ITEM_SIZE = (SCREEN_WIDTH - 2) / NUM_COLUMNS;

interface ImageGridProps {
  images: GalleryImage[];
  refreshing: boolean;
  onRefresh: () => void;
  onImagePress: (image: GalleryImage) => void;
}

export default function ImageGrid({ images, refreshing, onRefresh, onImagePress }: ImageGridProps) {
  const renderItem = useCallback(
    ({ item }: { item: GalleryImage }) => (
      <ImageCard image={item} size={ITEM_SIZE} onPress={onImagePress} />
    ),
    [onImagePress],
  );

  const keyExtractor = useCallback((item: GalleryImage) => String(item.id), []);

  const refreshControl = useMemo(
    () => <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#000" />,
    [refreshing, onRefresh],
  );

  return (
    <FlatList
      style={styles.container}
      data={images}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      numColumns={NUM_COLUMNS}
      refreshControl={refreshControl}
      contentContainerStyle={styles.grid}
      removeClippedSubviews={Platform.OS !== 'ios'}
      windowSize={5}
      maxToRenderPerBatch={8}
      initialNumToRender={6}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  grid: {
    paddingBottom: 20,
  },
});
