import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import type { GalleryImage } from '@gallery/shared';

import GalleryScreen from '@/screens/GalleryScreen';
import ImageDetailScreen from '@/screens/ImageDetailScreen';
import ArtistsScreen from '@/screens/ArtistsScreen';
import ArtistDetailScreen from '@/screens/ArtistDetailScreen';
import CartScreen from '@/screens/CartScreen';
import ProfileScreen from '@/screens/ProfileScreen';
import LoginScreen from '@/screens/LoginScreen';
import OrderDetailScreen from '@/screens/OrderDetailScreen';
import { useCartStore } from '@/store/cart';

export type GalleryStackParams = {
  Gallery: undefined;
  ImageDetail: { imageId: number; image?: GalleryImage };
};

export type ArtistsStackParams = {
  Artists: undefined;
  ArtistDetail: { artistId: number; artistName: string };
  ArtistImageDetail: { imageId: number; image?: GalleryImage };
};

export type CartStackParams = {
  Cart: undefined;
};

export type ProfileStackParams = {
  Profile: undefined;
  OrderDetail: { orderId: number; accessToken?: string };
};

export type RootStackParams = {
  MainTabs: undefined;
  Login: undefined;
  OrderDetail: { orderId: number; accessToken?: string };
};

const GalleryStack = createNativeStackNavigator<GalleryStackParams>();
const ArtistsStack = createNativeStackNavigator<ArtistsStackParams>();
const Tab = createBottomTabNavigator();
const RootStack = createNativeStackNavigator<RootStackParams>();

function GalleryNavigator() {
  return (
    <GalleryStack.Navigator>
      <GalleryStack.Screen name="Gallery" component={GalleryScreen} />
      <GalleryStack.Screen
        name="ImageDetail"
        component={ImageDetailScreen}
        options={{ title: '' }}
      />
    </GalleryStack.Navigator>
  );
}

function ArtistsNavigator() {
  return (
    <ArtistsStack.Navigator>
      <ArtistsStack.Screen name="Artists" component={ArtistsScreen} />
      <ArtistsStack.Screen
        name="ArtistDetail"
        component={ArtistDetailScreen}
        options={({ route }) => ({ title: route.params.artistName })}
      />
      <ArtistsStack.Screen
        name="ArtistImageDetail"
        component={ImageDetailScreen}
        options={{ title: '' }}
      />
    </ArtistsStack.Navigator>
  );
}

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text
      style={{
        fontSize: 10,
        color: focused ? '#000' : '#999',
        fontWeight: focused ? '600' : '400',
      }}
    >
      {label}
    </Text>
  );
}

function CartBadge() {
  const count = useCartStore((s) => s.items.length);
  if (count === 0) return null;
  return (
    <Text
      style={{
        position: 'absolute',
        top: -4,
        right: -10,
        backgroundColor: '#000',
        color: '#fff',
        fontSize: 10,
        fontWeight: '700',
        minWidth: 16,
        height: 16,
        borderRadius: 8,
        textAlign: 'center',
        lineHeight: 16,
        overflow: 'hidden',
        paddingHorizontal: 4,
      }}
    >
      {count}
    </Text>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen
        name="GalleryTab"
        component={GalleryNavigator}
        options={{
          tabBarLabel: 'Gallery',
          tabBarIcon: ({ focused }) => <TabIcon label="🖼" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="ArtistsTab"
        component={ArtistsNavigator}
        options={{
          tabBarLabel: 'Artists',
          tabBarIcon: ({ focused }) => <TabIcon label="👤" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="CartTab"
        component={CartScreen}
        options={{
          tabBarLabel: 'Cart',
          tabBarIcon: ({ focused }) => (
            <>
              <TabIcon label="🛒" focused={focused} />
              <CartBadge />
            </>
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon label="⚙️" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <RootStack.Navigator>
      <RootStack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
      <RootStack.Group screenOptions={{ presentation: 'modal' }}>
        <RootStack.Screen name="Login" component={LoginScreen} options={{ title: 'Sign In' }} />
        <RootStack.Screen
          name="OrderDetail"
          component={OrderDetailScreen}
          options={{ title: 'Order' }}
        />
      </RootStack.Group>
    </RootStack.Navigator>
  );
}
