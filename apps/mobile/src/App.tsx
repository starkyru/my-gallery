import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from '@/navigation';
import { useAuthStore } from '@/store/auth';
import { useConfigStore } from '@/store/config';
import { useGalleryStore } from '@/store/gallery';

export default function App() {
  const hydrateAuth = useAuthStore((s) => s.hydrate);
  const loadConfig = useConfigStore((s) => s.load);
  const refreshAll = useGalleryStore((s) => s.refreshAll);

  useEffect(() => {
    hydrateAuth();
    loadConfig();
    refreshAll();
  }, [hydrateAuth, loadConfig, refreshAll]);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
