import { Stack } from "expo-router";

export default function ProfileStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="[userId]" />
      <Stack.Screen name="search" />
      <Stack.Screen name="settings" />
    </Stack>
  );
}
