import React, { memo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import { uploadUrl } from '@/lib/api';
import type { CartItem, OrderItemType } from '@gallery/shared';

interface Props {
  item: CartItem;
  onRemove: (imageId: number, type: OrderItemType, printSku: string | null) => void;
}

function CartItemRow({ item, onRemove }: Props) {
  return (
    <View style={styles.row}>
      <FastImage
        style={styles.thumb}
        source={{ uri: uploadUrl(item.thumbnailPath) }}
        resizeMode={FastImage.resizeMode.cover}
      />
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {item.title}
        </Text>
        {item.printDescription && (
          <Text style={styles.sub} numberOfLines={1}>
            {item.printDescription}
          </Text>
        )}
        <Text style={styles.price}>${item.price}</Text>
      </View>
      <TouchableOpacity
        style={styles.remove}
        onPress={() => onRemove(item.imageId, item.type, item.printSku)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.removeText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

export default memo(CartItemRow);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  sub: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  price: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
    marginTop: 2,
  },
  remove: {
    padding: 8,
  },
  removeText: {
    fontSize: 16,
    color: '#999',
    fontWeight: '600',
  },
});
