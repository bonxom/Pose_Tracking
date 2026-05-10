import AppButton from "@/components/common/AppButton";
import AppInput from "@/components/common/AppInput";
import Screen from "@/components/common/Screen";
import { getUserInfo, updateUserInfo } from "@/repositories/userRepository";
import demoStyles from "@/styles/demo.styles";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, Text, View } from "react-native";

export default function ProfileEditScreen() {
  const [username, setUsername] = useState("");
  const [height, setHeight] = useState("");
  const [status, setStatus] = useState("");

  useFocusEffect(
    useCallback(() => {
      const loadProfile = async () => {
        const user = await getUserInfo();
        setUsername(user.displayName || user.username || "");
        setHeight(user.height || "");
      };
      loadProfile().catch((error) => setStatus(error.message));
    }, []),
  );

  const saveProfile = async () => {
    try {
      await updateUserInfo({ username, height });
      setStatus("Đã cập nhật hồ sơ.");
      router.back();
    } catch (error) {
      setStatus(error.message || "Không thể cập nhật hồ sơ.");
    }
  };

  return (
    <Screen style={demoStyles.screen}>
      <ScrollView contentContainerStyle={demoStyles.scrollContent}>
        <View style={demoStyles.header}>
          <Text style={demoStyles.title}>Hồ sơ cá nhân</Text>
          <Text style={demoStyles.subtitle}>Cập nhật thông tin theo API set_user_info.</Text>
        </View>

        <View style={demoStyles.card}>
          <AppInput label="Tên hiển thị" value={username} onChangeText={setUsername} />
          <AppInput label="Chiều cao" value={height} onChangeText={setHeight} keyboardType="numeric" />
          <AppButton title="Lưu hồ sơ" onPress={saveProfile} />
          {status ? <Text style={demoStyles.cardText}>{status}</Text> : null}
        </View>
      </ScrollView>
    </Screen>
  );
}
