import React, { useCallback, useEffect } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useGalleryStore } from '@/store/gallery';
import { useConfigStore } from '@/store/config';
import ImageCard from '@/components/ImageCard';
import FilterChips from '@/components/FilterChips';
import type { GalleryImage } from '@gallery/shared';
import type { GalleryStackParams } from '@/navigation';

const SCREEN_WIDTH = Dimensions.get('window').width;
const NUM_COLUMNS = 2;
const ITEM_SIZE = (SCREEN_WIDTH - 2) / NUM_COLUMNS;

type Props = NativeStackScreenProps<GalleryStackParams, 'Gallery'>;

export default function GalleryScreen({ navigation }: Props) {
  const { images, categories, filters, loading, setFilters, fetchImages, fetchCategories } =
    useGalleryStore();
  const galleryName = useConfigStore((s) => s.config.galleryName);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    navigation.setOptions({ title: galleryName });
  }, [navigation, galleryName]);

  const onImagePress = useCallback(
    (image: GalleryImage) => {
      navigation.navigate('ImageDetail', { imageId: image.id, image });
    },
    [navigation],
  );

  const categoryChips = categories.map((c) => ({
    label: c.name,
    value: c.slug,
  }));

  const renderItem = useCallback(
    ({ item }: { item: GalleryImage }) => (
      <ImageCard image={item} size={ITEM_SIZE} onPress={onImagePress} />
    ),
    [onImagePress],
  );

  const keyExtractor = useCallback((item: GalleryImage) => String(item.id), []);

  return (
    <View style={styles.container}>
      <FilterChips
        items={categoryChips}
        selected={filters.category}
        onSelect={(category) => setFilters({ ...filters, category })}
      />
      {loading && images.length === 0 ? (
        <ActivityIndicator style={styles.loader} size="large" color="#000" />
      ) : images.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No images found</Text>
        </View>
      ) : (
        <FlatList
          data={images}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          numColumns={NUM_COLUMNS}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={fetchImages} tintColor="#000" />
          }
          contentContainerStyle={styles.grid}
        />
      )}
    </View>
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
  loader: {
    flex: 1,
    justifyContent: 'center',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});
