import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import GalleryScreen from '@/screens/GalleryScreen';
import ImageDetailScreen from '@/screens/ImageDetailScreen';
import type { GalleryStackParams } from './types';

const Stack = createNativeStackNavigator<GalleryStackParams>();

export default function GalleryNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Gallery" component={GalleryScreen} />
      <Stack.Screen name="ImageDetail" component={ImageDetailScreen} options={{ title: '' }} />
    </Stack.Navigator>
  );
}
