import React, { memo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import { uploadUrl } from '@/lib/api';
import type { Artist } from '@gallery/shared';

interface ArtistRowProps {
  artist: Artist;
  onPress: (artist: Artist) => void;
}

function ArtistRow({ artist, onPress }: ArtistRowProps) {
  return (
    <TouchableOpacity style={styles.row} onPress={() => onPress(artist)} activeOpacity={0.7}>
      {artist.portraitPath ? (
        <FastImage
          style={styles.avatar}
          source={{ uri: uploadUrl(artist.portraitPath) }}
          resizeMode={FastImage.resizeMode.cover}
        />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <Text style={styles.avatarInitial}>{artist.name[0]}</Text>
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.name}>{artist.name}</Text>
        {artist.bio && (
          <Text style={styles.bio} numberOfLines={2}>
            {artist.bio}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default memo(ArtistRow);

const styles = StyleSheet.create({
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
