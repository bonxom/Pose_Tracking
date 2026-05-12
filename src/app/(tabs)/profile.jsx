import AppButton from "@/components/common/AppButton";
import { DEMO_COURSE } from "@/constants/demo";
import { logoutSession } from "@/repositories/authRepository";
import { getSourceLabel } from "@/repositories/source";
import { getUserInfo } from "@/repositories/userRepository";
import demoStyles from "@/styles/demo.styles";
import { getInitials } from "@/utils/formatters";
import { clearAuthSession, getAuthSession } from "@/utils/session";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

export default function ProfileScreen() {
  const [session, setSession] = useState(null);

  useFocusEffect(
    useCallback(() => {
      const loadSession = async () => {
        const currentSession = await getAuthSession();
        try {
          setSession(await getUserInfo());
        } catch {
          setSession(currentSession);
        }
      };
      loadSession();
    }, []),
  );

  const handleLogout = async () => {
    await logoutSession(session);
    await clearAuthSession();
    router.replace("/(auth)/login");
  };

  const displayName = session?.displayName || session?.username || "Người dùng";
  const role = session?.role || "HV";

  const menuItems = [
    {
      label: "My profile",
      detail: `${displayName} · ${role}`,
      onPress: () => router.push("/settings/profile-edit"),
    },
    {
      label: "My posts",
      detail: "Tìm kiếm trong hồ sơ",
      onPress: () =>
        router.push({
          pathname: "/(tabs)/search",
          params: { userId: session?.id || "" },
        }),
    },
    {
      label: "My courses",
      detail: DEMO_COURSE.title,
      onPress: () => router.push("/(tabs)/courses"),
    },
    {
      label: "Messages",
      detail: "Cuộc trò chuyện GV/HV",
      onPress: () => router.push("/chat"),
    },
    {
      label: "Notifications",
      detail: "Thông báo và trạng thái đọc",
      onPress: () => router.push("/(tabs)/notifications"),
    },
    {
      label: "Settings",
      detail: "Push, mật khẩu, chặn người dùng",
      onPress: () => router.push("/settings"),
    },
  ];

  return (
    <View style={demoStyles.screen}>
      <ScrollView contentContainerStyle={demoStyles.scrollContent}>
        <View style={demoStyles.header}>
          <View style={demoStyles.row}>
            <View style={demoStyles.avatar}>
              <Text style={demoStyles.avatarText}>
                {getInitials(displayName)}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={demoStyles.title}>{displayName}</Text>
              <Text style={demoStyles.subtitle}>
                {role} ·{" "}
                {session?.phonenumber || session?.identifier || "0900000001"}
              </Text>
            </View>
          </View>
          <View style={demoStyles.badge}>
            <Text style={demoStyles.badgeText}>
              {session?.demoMode
                ? "Demo mode"
                : getSourceLabel(session?.source)}
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
          <Text style={demoStyles.cardTitle}>Trạng thái dữ liệu</Text>
          <Text style={demoStyles.cardText}>
            Mặc định sản phẩm dùng server. Nút demo trên màn hình đăng nhập chỉ
            dành cho phát triển và chạy local riêng biệt.
          </Text>
          <AppButton title="Đăng xuất" onPress={handleLogout} />
        </View>
      </ScrollView>
    </View>
  );
}
