import AppButton from "@/components/common/AppButton";
import Screen from "@/components/common/Screen";
import { checkNewVersion, setDeviceToken } from "@/repositories/settingsRepository";
import demoStyles from "@/styles/demo.styles";
import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";

export default function SettingsScreen() {
  const [status, setStatus] = useState("");

  const registerDevice = async () => {
    try {
      await setDeviceToken();
      setStatus("Đã gửi device token lên server hoặc local dev mode.");
    } catch (error) {
      setStatus(error.message || "Không thể gửi device token.");
    }
  };

  const checkVersion = async () => {
    try {
      const result = await checkNewVersion();
      setStatus(`Version check: ${JSON.stringify(result).slice(0, 120)}`);
    } catch (error) {
      setStatus(error.message || "Không thể kiểm tra phiên bản.");
    }
  };

  return (
    <Screen style={demoStyles.screen}>
      <ScrollView contentContainerStyle={demoStyles.scrollContent}>
        <View style={demoStyles.header}>
          <Text style={demoStyles.title}>Cài đặt</Text>
          <Text style={demoStyles.subtitle}>Tài khoản, thông báo, bảo mật và thiết bị.</Text>
        </View>

        <View style={demoStyles.card}>
          <AppButton title="Chỉnh sửa hồ sơ" onPress={() => router.push("/settings/profile-edit")} />
          <AppButton title="Cài đặt thông báo" onPress={() => router.push("/settings/push")} />
          <AppButton title="Đổi mật khẩu" onPress={() => router.push("/settings/change-password")} />
          <AppButton title="Danh sách chặn" onPress={() => router.push("/settings/blocks")} />
          <AppButton title="Gửi device token" onPress={registerDevice} />
          <AppButton title="Kiểm tra phiên bản" onPress={checkVersion} />
          {status ? <Text style={demoStyles.cardText}>{status}</Text> : null}
        </View>
      </ScrollView>
    </Screen>
  );
}
