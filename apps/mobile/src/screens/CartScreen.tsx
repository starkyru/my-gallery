import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCartStore } from '@/store/cart';
import { useAuthStore } from '@/store/auth';
import CartItemRow from '@/components/CartItemRow';
import type { CartItem } from '@gallery/shared';
import type { RootStackParams } from '@/navigation';

export default function CartScreen() {
  const { items, removeItem, clear, total } = useCartStore();
  const token = useAuthStore((s) => s.token);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParams>>();

  if (items.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Your cart is empty</Text>
      </View>
    );
  }

  const handleCheckout = () => {
    if (!token) {
      navigation.navigate('Login');
      return;
    }
    // TODO: implement checkout flow (create order + payment)
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        renderItem={({ item }: { item: CartItem }) => (
          <CartItemRow item={item} onRemove={removeItem} />
        )}
        keyExtractor={(item) => `${item.imageId}-${item.type}-${item.printSku || ''}`}
      />
      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>${total().toFixed(2)}</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.clearBtn} onPress={clear}>
            <Text style={styles.clearBtnText}>Clear</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout}>
            <Text style={styles.checkoutBtnText}>Checkout</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  footer: {
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e0e0e0',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  clearBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
  },
  clearBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  checkoutBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#000',
    alignItems: 'center',
  },
  checkoutBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
