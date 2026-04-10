import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { api, uploadUrl } from '@/lib/api';
import { statusColor } from '@/lib/status-color';
import type { Order } from '@gallery/shared';
import type { RootStackParams } from '@/navigation';

type Props = NativeStackScreenProps<RootStackParams, 'OrderDetail'>;

export default function OrderDetailScreen({ route }: Props) {
  const { orderId, accessToken } = route.params;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.orders
      .get(orderId, accessToken)
      .then(setOrder)
      .finally(() => setLoading(false));
  }, [orderId, accessToken]);

  if (loading || !order) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.orderId}>Order #{order.id}</Text>
        <View style={[styles.badge, statusColor(order.status)]}>
          <Text style={styles.badgeText}>{order.status}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Date</Text>
        <Text style={styles.value}>{new Date(order.createdAt).toLocaleDateString()}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{order.customerEmail}</Text>
      </View>

      {order.paymentMethod && (
        <View style={styles.section}>
          <Text style={styles.label}>Payment</Text>
          <Text style={styles.value}>{order.paymentMethod}</Text>
        </View>
      )}

      {order.items && order.items.length > 0 && (
        <View style={styles.itemsSection}>
          <Text style={styles.sectionTitle}>Items</Text>
          {order.items.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              {item.image && (
                <FastImage
                  style={styles.itemThumb}
                  source={{ uri: uploadUrl(item.image.thumbnailPath) }}
                  resizeMode={FastImage.resizeMode.cover}
                />
              )}
              <View style={styles.itemInfo}>
                <Text style={styles.itemTitle}>
                  {item.image?.title ?? `Image #${item.imageId}`}
                </Text>
                <Text style={styles.itemType}>
                  {item.type === 'print' && item.printSku ? `Print: ${item.printSku}` : 'Original'}
                </Text>
              </View>
              <Text style={styles.itemPrice}>${item.price}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.totalSection}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>${order.total}</Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  orderId: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textTransform: 'capitalize',
  },
  section: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  label: {
    fontSize: 14,
    color: '#666',
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  itemsSection: {
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  itemThumb: {
    width: 44,
    height: 44,
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  itemType: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#000',
  },
});
