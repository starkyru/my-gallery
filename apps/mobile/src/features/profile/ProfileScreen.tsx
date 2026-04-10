import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import OrderRow from './components/OrderRow';
import SignInPrompt from '@/features/auth/components/SignInPrompt';

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
      <SignInPrompt message="Sign in to view orders" onPress={() => navigation.navigate('Login')} />
    );
  }

  const handleOrderPress = useCallback(
    (order: Order) => {
      navigation.navigate('OrderDetail', { orderId: order.id, accessToken: order.accessToken });
    },
    [navigation],
  );

  const renderOrder = useCallback(
    ({ item }: { item: Order }) => <OrderRow order={item} onPress={handleOrderPress} />,
    [handleOrderPress],
  );

  const keyExtractor = useCallback((item: Order) => String(item.id), []);

  const refreshControl = useMemo(
    () => <RefreshControl refreshing={loading} onRefresh={fetchOrders} tintColor="#000" />,
    [loading, fetchOrders],
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
          keyExtractor={keyExtractor}
          refreshControl={refreshControl}
          initialNumToRender={10}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
});
