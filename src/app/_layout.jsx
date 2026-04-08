import { getAuthSession } from '@/utils/session';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const syncSessionAndGuardRoute = async () => {
      try {
        const session = await getAuthSession();
        if (!isMounted) return;

        const currentGroup = segments[0];
        const isAuthenticated = Boolean(session);
        const isAuthGroup = currentGroup === '(auth)';
        const isSignupSuccess =
          currentGroup === '(auth)' && segments[1] === 'signup-success';

        if (!isAuthenticated && !isAuthGroup) {
          router.replace('/(auth)/login');
          return;
        }

        if (isAuthenticated && isAuthGroup && !isSignupSuccess) {
          router.replace('/(tabs)/home');
        }
      } finally {
        if (isMounted) {
          setIsBootstrapping(false);
        }
      }
    };

    syncSessionAndGuardRoute();

    return () => {
      isMounted = false;
    };
  }, [router, segments]);

  if (isBootstrapping) {
    return (
      <SafeAreaProvider>
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#FFFFFF',
          }}
        >
          <ActivityIndicator />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="post" />
        <Stack.Screen name="comment" />
      </Stack>
    </SafeAreaProvider>
  );
}
