import React, { useCallback, useEffect } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useGalleryStore } from '@/store/gallery';
import type { Artist } from '@gallery/shared';
import type { ArtistsStackParams } from '@/navigation';
import ArtistRow from '@/components/ArtistRow';

type Props = NativeStackScreenProps<ArtistsStackParams, 'Artists'>;

export default function ArtistsScreen({ navigation }: Props) {
  const { artists, loading, fetchArtists } = useGalleryStore();

  useEffect(() => {
    if (artists.length === 0) fetchArtists();
  }, [artists.length, fetchArtists]);

  const handleArtistPress = useCallback(
    (artist: Artist) => {
      navigation.navigate('ArtistDetail', { artistId: artist.id, artistName: artist.name });
    },
    [navigation],
  );

  const renderItem = useCallback(
    ({ item }: { item: Artist }) => <ArtistRow artist={item} onPress={handleArtistPress} />,
    [handleArtistPress],
  );

  const keyExtractor = useCallback((item: Artist) => item.id.toString(), []);

  if (loading && artists.length === 0) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={artists}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={fetchArtists} tintColor="#000" />
      }
    />
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
    alignItems: 'center',
  },
});
