import AppButton from "@/components/common/AppButton";
import AppInput from "@/components/common/AppInput";
import Screen from "@/components/common/Screen";
import { changePassword } from "@/repositories/settingsRepository";
import demoStyles from "@/styles/demo.styles";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";

export default function ChangePasswordScreen() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [status, setStatus] = useState("");

  const submit = async () => {
    if (!oldPassword || newPassword.length < 6) {
      setStatus("Mật khẩu mới cần ít nhất 6 ký tự.");
      return;
    }

    try {
      await changePassword(oldPassword, newPassword);
      setStatus("Đã đổi mật khẩu.");
      setOldPassword("");
      setNewPassword("");
    } catch (error) {
      setStatus(error.message || "Không thể đổi mật khẩu.");
    }
  };

  return (
    <Screen style={demoStyles.screen}>
      <ScrollView contentContainerStyle={demoStyles.scrollContent}>
        <View style={demoStyles.header}>
          <Text style={demoStyles.title}>Đổi mật khẩu</Text>
          <Text style={demoStyles.subtitle}>Gửi yêu cầu change_password tới server khi có session thật.</Text>
        </View>

        <View style={demoStyles.card}>
          <AppInput label="Mật khẩu hiện tại" value={oldPassword} onChangeText={setOldPassword} secureTextEntry />
          <AppInput label="Mật khẩu mới" value={newPassword} onChangeText={setNewPassword} secureTextEntry />
          <AppButton title="Đổi mật khẩu" onPress={submit} />
          {status ? <Text style={demoStyles.cardText}>{status}</Text> : null}
        </View>
      </ScrollView>
    </Screen>
  );
}
