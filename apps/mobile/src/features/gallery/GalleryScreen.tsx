import React, { useCallback, useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useGalleryStore } from '@/store/gallery';
import { useConfigStore } from '@/store/config';
import { uploadUrl } from '@/lib/api';
import { useSharedTransition, type SourceRect } from '@/lib/shared-transition';
import ImageGrid from '@/components/ImageGrid';
import FilterChips from './components/FilterChips';
import type { GalleryImage } from '@gallery/shared';
import type { GalleryStackParams } from '@/navigation';

type Props = NativeStackScreenProps<GalleryStackParams, 'Gallery'>;

export default function GalleryScreen({ navigation }: Props) {
  const { images, categories, filters, loading, setFilters, fetchImages, fetchCategories } =
    useGalleryStore();
  const galleryName = useConfigStore((s) => s.config.galleryName);
  const startTransition = useSharedTransition((s) => s.start);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    navigation.setOptions({ title: galleryName });
  }, [navigation, galleryName]);

  const onImagePress = useCallback(
    (image: GalleryImage, sourceRect: SourceRect) => {
      if (sourceRect.width > 0 && sourceRect.height > 0) {
        startTransition(sourceRect, uploadUrl(image.watermarkPath), image.height / image.width);
      }
      navigation.navigate('ImageDetail', { imageId: image.id, image });
    },
    [navigation, startTransition],
  );

  const categoryChips = categories.map((c) => ({
    label: c.name,
    value: c.slug,
  }));

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
        <ImageGrid
          images={images}
          refreshing={loading}
          onRefresh={fetchImages}
          onImagePress={onImagePress}
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
