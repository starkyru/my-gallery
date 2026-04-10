import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '@/screens/LoginScreen';
import OrderDetailScreen from '@/screens/OrderDetailScreen';
import MainTabs from './MainTabs';
import type { RootStackParams } from './types';

const Stack = createNativeStackNavigator<RootStackParams>();

export default function RootNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Group screenOptions={{ presentation: 'modal' }}>
        <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Sign In' }} />
        <Stack.Screen
          name="OrderDetail"
          component={OrderDetailScreen}
          options={{ title: 'Order' }}
        />
      </Stack.Group>
    </Stack.Navigator>
  );
}
