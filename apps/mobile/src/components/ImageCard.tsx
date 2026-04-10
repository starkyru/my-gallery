import React, { memo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import { uploadUrl } from '@/lib/api';
import type { GalleryImage } from '@gallery/shared';

interface Props {
  image: GalleryImage;
  size: number;
  onPress: (image: GalleryImage) => void;
}

function ImageCard({ image, size, onPress }: Props) {
  return (
    <TouchableOpacity
      style={[styles.container, { width: size, height: size }]}
      onPress={() => onPress(image)}
      activeOpacity={0.8}
    >
      <FastImage
        style={styles.image}
        source={{ uri: uploadUrl(image.watermarkPath), priority: FastImage.priority.normal }}
        resizeMode={FastImage.resizeMode.cover}
      />
      <View style={styles.overlay}>
        <Text style={styles.title} numberOfLines={1}>
          {image.title}
        </Text>
        <Text style={styles.price}>${image.price}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default memo(ImageCard);

const styles = StyleSheet.create({
  container: {
    margin: 1,
    backgroundColor: '#f0f0f0',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 6,
    paddingVertical: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '500',
    flex: 1,
    marginRight: 4,
  },
  price: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
});
