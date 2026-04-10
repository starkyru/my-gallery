import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { api } from '@/lib/api';
import ImageGrid from '@/components/ImageGrid';
import type { GalleryImage } from '@gallery/shared';
import type { ArtistsStackParams } from '@/navigation';

type Props = NativeStackScreenProps<ArtistsStackParams, 'ArtistDetail'>;

export default function ArtistDetailScreen({ route, navigation }: Props) {
  const { artistId } = route.params;
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchImages = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.images.list(`artistId=${artistId}`);
      setImages(data);
    } finally {
      setLoading(false);
    }
  }, [artistId]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const onImagePress = useCallback(
    (image: GalleryImage) => {
      navigation.navigate('ArtistImageDetail', { imageId: image.id, image });
    },
    [navigation],
  );

  if (loading && images.length === 0) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  if (images.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No images</Text>
      </View>
    );
  }

  return (
    <ImageGrid
      images={images}
      refreshing={loading}
      onRefresh={fetchImages}
      onImagePress={onImagePress}
    />
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
