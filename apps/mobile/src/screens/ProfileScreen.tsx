import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '@/store/auth';
import { api } from '@/lib/api';
import type { Order } from '@gallery/shared';
import type { RootStackParams } from '@/navigation';

export default function ProfileScreen() {
  const { token, role, logout } = useAuthStore();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParams>>();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchOrders = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await api.orders.list(token);
      setOrders(data);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) fetchOrders();
  }, [token, fetchOrders]);

  if (!token) {
    return (
      <View style={styles.centered}>
        <Text style={styles.heading}>Sign in to view orders</Text>
        <TouchableOpacity style={styles.loginBtn} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.loginBtnText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderOrder = ({ item }: { item: Order }) => (
    <TouchableOpacity
      style={styles.orderRow}
      onPress={() =>
        navigation.navigate('OrderDetail', { orderId: item.id, accessToken: item.accessToken })
      }
    >
      <View>
        <Text style={styles.orderId}>Order #{item.id}</Text>
        <Text style={styles.orderDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
      </View>
      <View style={styles.orderRight}>
        <Text style={styles.orderTotal}>${item.total}</Text>
        <View style={[styles.badge, statusColor(item.status)]}>
          <Text style={styles.badgeText}>{item.status}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>{role === 'admin' ? 'Admin' : 'Artist'}</Text>
        <TouchableOpacity onPress={logout}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.sectionTitle}>Orders</Text>
      {loading && orders.length === 0 ? (
        <ActivityIndicator style={styles.loader} size="large" color="#000" />
      ) : orders.length === 0 ? (
        <Text style={styles.emptyText}>No orders yet</Text>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrder}
          keyExtractor={(item) => String(item.id)}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={fetchOrders} tintColor="#000" />
          }
        />
      )}
    </View>
  );
}

function statusColor(status: string) {
  switch (status) {
    case 'paid':
      return { backgroundColor: '#e6f4ea' };
    case 'completed':
      return { backgroundColor: '#d4edda' };
    case 'expired':
      return { backgroundColor: '#fce4e4' };
    default:
      return { backgroundColor: '#fff3cd' };
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  heading: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  logoutText: {
    fontSize: 14,
    color: '#e00',
    fontWeight: '600',
  },
  loginBtn: {
    marginTop: 16,
    backgroundColor: '#000',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  loginBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    padding: 16,
    paddingBottom: 8,
  },
  loader: {
    marginTop: 24,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    marginTop: 24,
  },
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
