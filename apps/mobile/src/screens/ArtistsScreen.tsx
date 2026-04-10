import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useGalleryStore } from '@/store/gallery';
import { uploadUrl } from '@/lib/api';
import type { Artist } from '@gallery/shared';
import type { ArtistsStackParams } from '@/navigation';

type Props = NativeStackScreenProps<ArtistsStackParams, 'Artists'>;

export default function ArtistsScreen({ navigation }: Props) {
  const { artists, loading, fetchArtists } = useGalleryStore();

  useEffect(() => {
    if (artists.length === 0) fetchArtists();
  }, [artists.length, fetchArtists]);

  const renderItem = ({ item }: { item: Artist }) => (
    <TouchableOpacity
      style={styles.row}
      onPress={() =>
        navigation.navigate('ArtistDetail', { artistId: item.id, artistName: item.name })
      }
      activeOpacity={0.7}
    >
      {item.portraitPath ? (
        <FastImage
          style={styles.avatar}
          source={{ uri: uploadUrl(item.portraitPath) }}
          resizeMode={FastImage.resizeMode.cover}
        />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <Text style={styles.avatarInitial}>{item.name[0]}</Text>
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        {item.bio && (
          <Text style={styles.bio} numberOfLines={2}>
            {item.bio}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

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
      keyExtractor={(item) => String(item.id)}
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#f0f0f0',
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 20,
    fontWeight: '700',
    color: '#999',
  },
  info: {
    flex: 1,
    marginLeft: 14,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  bio: {
    fontSize: 13,
    color: '#666',
    marginTop: 3,
    lineHeight: 18,
  },
});
