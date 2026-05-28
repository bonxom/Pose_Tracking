import { startInAppNotificationRuntime } from "@/services/pushNotifications";
import { getAuthSession } from "@/utils/session";
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const currentGroup = segments[0];
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const syncSessionAndGuardRoute = async () => {
      try {
        const session = await getAuthSession();
        if (!isMounted) return;

        const isAuthenticated = Boolean(session);
        const isAuthGroup = currentGroup === "(auth)";
        const isSignupSuccess =
          currentGroup === "(auth)" && segments[1] === "signup-success";

        if (!isAuthenticated && !isAuthGroup) {
          router.replace("/(auth)/login");
          return;
        }

        if (isAuthenticated && isAuthGroup && !isSignupSuccess) {
          router.replace("/(tabs)/home");
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
  }, [currentGroup, router, segments]);

  useEffect(() => {
    if (currentGroup === "(auth)") return undefined;
    return startInAppNotificationRuntime();
  }, [currentGroup]);

  if (isBootstrapping) {
    return (
      <SafeAreaProvider>
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#FFFFFF",
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
        <Stack.Screen name="settings" />
        <Stack.Screen name="chat" />
        <Stack.Screen name="profile" />
      </Stack>
    </SafeAreaProvider>
  );
}
