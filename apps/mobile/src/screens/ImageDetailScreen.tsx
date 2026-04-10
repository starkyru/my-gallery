import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import { api, uploadUrl } from '@/lib/api';
import { useCartStore } from '@/store/cart';
import type { GalleryImage, ImagePrintOption, OrderItemType } from '@gallery/shared';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Props = {
  route: { params: { imageId: number; image?: GalleryImage } };
  navigation: { setOptions: (opts: Record<string, string>) => void };
};

export default function ImageDetailScreen({ route, navigation }: Props) {
  const { imageId, image: passedImage } = route.params;
  const [image, setImage] = useState<GalleryImage | null>(passedImage ?? null);
  const [loading, setLoading] = useState(!passedImage);
  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    if (!passedImage) {
      api.images
        .get(imageId)
        .then(setImage)
        .finally(() => setLoading(false));
    }
  }, [imageId, passedImage]);

  useEffect(() => {
    if (image) {
      navigation.setOptions({ title: image.title });
    }
  }, [image, navigation]);

  const addToCart = useCallback(
    (printOption?: ImagePrintOption) => {
      if (!image) return;
      addItem({
        imageId: image.id,
        title: image.title,
        price: printOption ? printOption.price : image.price,
        thumbnailPath: image.thumbnailPath,
        type: (printOption ? 'print' : 'original') as OrderItemType,
        printSku: printOption?.sku ?? null,
        printDescription: printOption?.description ?? null,
      });
      Alert.alert('Added to cart', printOption ? printOption.description : 'Original');
    },
    [image, addItem],
  );

  if (loading || !image) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  const imageHeight = (SCREEN_WIDTH * image.height) / image.width;

  return (
    <ScrollView style={styles.container} bounces={false}>
      <FastImage
        style={{ width: SCREEN_WIDTH, height: imageHeight }}
        source={{ uri: uploadUrl(image.watermarkPath), priority: FastImage.priority.high }}
        resizeMode={FastImage.resizeMode.contain}
      />
      <View style={styles.content}>
        <Text style={styles.title}>{image.title}</Text>
        <Text style={styles.artist}>{image.artist.name}</Text>
        {image.description && <Text style={styles.description}>{image.description}</Text>}

        <View style={styles.meta}>
          {image.place && <Text style={styles.metaText}>📍 {image.place}</Text>}
          {image.shotDate && <Text style={styles.metaText}>📅 {image.shotDate}</Text>}
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.price}>${image.price}</Text>
          <TouchableOpacity
            style={[styles.button, Number(image.price) === 0 && styles.addBtnDisabled]}
            onPress={() => addToCart()}
            disabled={Number(image.price) === 0}
          >
            <Text
              style={[styles.buttonText, Number(image.price) === 0 && styles.addBtnTextDisabled]}
            >
              Add Original
            </Text>
          </TouchableOpacity>
        </View>

        {image.printEnabled && image.printOptions.length > 0 && (
          <View style={styles.prints}>
            <Text style={styles.sectionTitle}>Print Options</Text>
            {image.printOptions.map((option) => {
              const soldOut = option.printLimit !== null && option.soldCount >= option.printLimit;
              return (
                <View key={option.id} style={styles.printRow}>
                  <View style={styles.printInfo}>
                    <Text style={styles.printDesc}>{option.description}</Text>
                    <Text style={styles.printSize}>
                      {option.widthCm}×{option.heightCm} cm
                    </Text>
                  </View>
                  <Text style={styles.printPrice}>${option.price}</Text>
                  <TouchableOpacity
                    style={[
                      styles.addBtn,
                      (soldOut || Number(option.price) === 0) && styles.addBtnDisabled,
                    ]}
                    onPress={() => addToCart(option)}
                    disabled={soldOut || Number(option.price) === 0}
                  >
                    <Text
                      style={[
                        styles.addBtnText,
                        (soldOut || Number(option.price) === 0) && styles.addBtnTextDisabled,
                      ]}
                    >
                      {soldOut ? 'Sold out' : 'Add'}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
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
  content: {
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
  },
  artist: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  description: {
    fontSize: 14,
    color: '#333',
    marginTop: 12,
    lineHeight: 20,
  },
  meta: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  metaText: {
    fontSize: 13,
    color: '#666',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e0e0e0',
  },
  price: {
    fontSize: 24,
    fontWeight: '800',
    color: '#000',
  },
  button: {
    backgroundColor: '#000',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  prints: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
  },
  printRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  printInfo: {
    flex: 1,
  },
  printDesc: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  printSize: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  printPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
    marginRight: 12,
  },
  addBtn: {
    backgroundColor: '#000',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addBtnDisabled: {
    backgroundColor: '#e0e0e0',
  },
  addBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  addBtnTextDisabled: {
    color: '#999',
  },
});
