/**
 * Primary author: Nguyen Quang Duc <Duc.NQ235044@sis.hust.edu.vn>
 * Maintainer: Nguyen Quang Duc
 * Ownership: >=90% current git blame on main as of 2026-07-04.
 * Code owner review: .github/CODEOWNERS
 */

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
