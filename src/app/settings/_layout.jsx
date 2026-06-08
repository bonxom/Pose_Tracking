import { Stack } from "expo-router";

export default function SettingsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="profile-edit" />
      <Stack.Screen name="push" />
      <Stack.Screen name="change-password" />
      <Stack.Screen name="blocks" />
      <Stack.Screen name="policies" />
    </Stack>
  );
}
