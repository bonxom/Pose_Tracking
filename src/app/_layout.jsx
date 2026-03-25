import { Stack } from "expo-router";

export default function RootLayout() {
  // Ẩn header
  return <Stack screenOptions={{ headerShown: false }} />;
}
