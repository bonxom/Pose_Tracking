import AppButton from "@/components/common/AppButton";
import Screen from "@/components/common/Screen";
import { DEMO_COURSE } from "@/constants/demo";
import demoStyles from "@/styles/demo.styles";
import { clearAuthSession, getAuthSession } from "@/utils/session";
import { getInitials } from "@/utils/formatters";
import { getSourceLabel } from "@/repositories/source";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

export default function ProfileScreen() {
  const [session, setSession] = useState(null);

  useFocusEffect(
    useCallback(() => {
      const loadSession = async () => {
        setSession(await getAuthSession());
      };
      loadSession();
    }, []),
  );

  const handleLogout = async () => {
    await clearAuthSession();
    router.replace("/(auth)/login");
  };

  const displayName = session?.displayName || session?.username || "Người dùng demo";
  const role = session?.role || "HV";

  const menuItems = [
    {
      label: "My profile",
      detail: `${displayName} · ${role}`,
      onPress: null,
    },
    {
      label: "My courses",
      detail: DEMO_COURSE.title,
      onPress: () => router.push("/(tabs)/courses"),
    },
    {
      label: "Notifications",
      detail: "Thông báo demo cục bộ",
      onPress: () => router.push("/(tabs)/notifications"),
    },
    {
      label: "Demo limitations",
      detail: "Local-first, backend-opportunistic",
      onPress: null,
    },
  ];

  return (
    <Screen style={demoStyles.screen}>
      <ScrollView contentContainerStyle={demoStyles.scrollContent}>
        <View style={demoStyles.header}>
          <View style={demoStyles.row}>
            <View style={demoStyles.avatar}>
              <Text style={demoStyles.avatarText}>{getInitials(displayName)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={demoStyles.title}>{displayName}</Text>
              <Text style={demoStyles.subtitle}>
                {role} · {session?.phonenumber || session?.identifier || "0900000001"}
              </Text>
            </View>
          </View>
          <View style={demoStyles.badge}>
            <Text style={demoStyles.badgeText}>
              {session?.demoMode ? "Demo mode" : getSourceLabel(session?.source)}
            </Text>
          </View>
        </View>

        <View style={demoStyles.card}>
          {menuItems.map((item) => (
            <Pressable key={item.label} onPress={item.onPress || undefined}>
              <View style={demoStyles.menuRow}>
                <View style={{ flex: 1 }}>
                  <Text style={demoStyles.cardTitle}>{item.label}</Text>
                  <Text style={demoStyles.cardText}>{item.detail}</Text>
                </View>
                <Text style={demoStyles.cardText}>›</Text>
              </View>
            </Pressable>
          ))}
        </View>

        <View style={demoStyles.card}>
          <Text style={demoStyles.cardTitle}>Demo đang dùng local fallback</Text>
          <Text style={demoStyles.cardText}>
            Auth demo, feed, nộp bài, chấm điểm, thông báo và tìm kiếm chạy cục bộ để tránh rủi ro backend/CORS trước buổi demo.
          </Text>
          <AppButton title="Đăng xuất" onPress={handleLogout} />
        </View>
      </ScrollView>
    </Screen>
  );
}
