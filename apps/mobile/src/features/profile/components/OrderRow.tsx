import React, { memo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { statusColor } from '@/lib/status-color';
import type { Order } from '@gallery/shared';

interface OrderRowProps {
  order: Order;
  onPress: (order: Order) => void;
}

function OrderRow({ order, onPress }: OrderRowProps) {
  return (
    <TouchableOpacity style={styles.orderRow} onPress={() => onPress(order)}>
      <View>
        <Text style={styles.orderId}>Order #{order.id}</Text>
        <Text style={styles.orderDate}>{new Date(order.createdAt).toLocaleDateString()}</Text>
      </View>
      <View style={styles.orderRight}>
        <Text style={styles.orderTotal}>${order.total}</Text>
        <View style={[styles.badge, statusColor(order.status)]}>
          <Text style={styles.badgeText}>{order.status}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default memo(OrderRow);

const styles = StyleSheet.create({
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  orderId: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  orderDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  orderRight: {
    alignItems: 'flex-end',
  },
  orderTotal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
  },
  badge: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#333',
    textTransform: 'capitalize',
  },
});
