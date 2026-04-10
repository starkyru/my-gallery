import React, { memo, useCallback, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import { Blurhash } from 'react-native-blurhash';
import { uploadUrl } from '@/lib/api';
import type { SourceRect } from '@/lib/shared-transition';
import type { GalleryImage } from '@gallery/shared';

interface Props {
  image: GalleryImage;
  size: number;
  onPress: (image: GalleryImage, sourceRect: SourceRect) => void;
}

function ImageCard({ image, size, onPress }: Props) {
  const viewRef = useRef<View>(null);
  const [loaded, setLoaded] = useState(false);

  const handlePress = useCallback(() => {
    viewRef.current?.measureInWindow((x, y, width, height) => {
      onPress(image, { x, y, width, height });
    });
  }, [image, onPress]);

  return (
    <TouchableOpacity
      ref={viewRef}
      style={[styles.container, { width: size, height: size }]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      {image.blurHash && !loaded && <Blurhash blurhash={image.blurHash} style={styles.blurhash} />}
      <FastImage
        style={styles.image}
        source={{ uri: uploadUrl(image.watermarkPath), priority: FastImage.priority.normal }}
        resizeMode={FastImage.resizeMode.cover}
        onLoad={() => setLoaded(true)}
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
  blurhash: {
    ...StyleSheet.absoluteFill,
    zIndex: 0,
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
