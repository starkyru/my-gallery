import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import CartScreen from '@/features/cart/CartScreen';
import ProfileScreen from '@/features/profile/ProfileScreen';
import { useCartStore } from '@/store/cart';
import GalleryNavigator from './GalleryNavigator';
import ArtistsNavigator from './ArtistsNavigator';

const Tab = createBottomTabNavigator();

function CartBadge() {
  const count = useCartStore((s) => s.items.length);
  if (count === 0) return null;
  return (
    <View
      style={{
        position: 'absolute',
        top: -4,
        right: -10,
        backgroundColor: '#000',
        minWidth: 16,
        height: 16,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
      }}
    >
      <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>{count}</Text>
    </View>
  );
}

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#000',
        tabBarInactiveTintColor: '#999',
      }}
    >
      <Tab.Screen
        name="GalleryTab"
        component={GalleryNavigator}
        options={{
          tabBarLabel: 'Gallery',
          tabBarIcon: ({ color, size }) => <Icon name="images-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="ArtistsTab"
        component={ArtistsNavigator}
        options={{
          tabBarLabel: 'Artists',
          tabBarIcon: ({ color, size }) => <Icon name="people-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="CartTab"
        component={CartScreen}
        options={{
          headerShown: true,
          title: 'Cart',
          tabBarLabel: 'Cart',
          tabBarIcon: ({ color, size }) => (
            <View>
              <Icon name="cart-outline" size={size} color={color} />
              <CartBadge />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          headerShown: true,
          title: 'Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => <Icon name="person-outline" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}
