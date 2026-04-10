import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ArtistsScreen from '@/features/artists/ArtistsScreen';
import ArtistDetailScreen from '@/features/artists/ArtistDetailScreen';
import ImageDetailScreen from '@/features/gallery/ImageDetailScreen';
import type { ArtistsStackParams } from './types';

const Stack = createNativeStackNavigator<ArtistsStackParams>();

export default function ArtistsNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Artists" component={ArtistsScreen} />
      <Stack.Screen
        name="ArtistDetail"
        component={ArtistDetailScreen}
        options={({ route }) => ({ title: route.params.artistName })}
      />
      <Stack.Screen
        name="ArtistImageDetail"
        component={ImageDetailScreen}
        options={{ title: '' }}
      />
    </Stack.Navigator>
  );
}
