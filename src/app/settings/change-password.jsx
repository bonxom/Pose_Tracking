import AppButton from "@/components/common/AppButton";
import AppInput from "@/components/common/AppInput";
import Screen from "@/components/common/Screen";
import ProfileIcon from "@/components/icons/ProfileIcon";
import colors from "@/constants/colors";
import sizes from "@/constants/sizes";
import { changePassword } from "@/repositories/settingsRepository";
import { redirectIfSessionExpired } from "@/utils/screenErrors";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

function longestCommonSubstringLength(first = "", second = "") {
  const rows = Array.from({ length: first.length + 1 }, () =>
    Array(second.length + 1).fill(0),
  );
  let best = 0;

  for (let i = 1; i <= first.length; i += 1) {
    for (let j = 1; j <= second.length; j += 1) {
      if (first[i - 1] === second[j - 1]) {
        rows[i][j] = rows[i - 1][j - 1] + 1;
        best = Math.max(best, rows[i][j]);
      }
    }
  }

  return best;
}

function isTooSimilar(oldValue, newValue) {
  if (!oldValue || !newValue) return false;
  const common = longestCommonSubstringLength(oldValue, newValue);
  return common / newValue.length >= 0.8;
}

export default function ChangePasswordScreen() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const submit = async () => {
    const oldValue = oldPassword.trim();
    const newValue = newPassword.trim();
    const confirmValue = confirmPassword.trim();

    if (!oldValue) {
      setStatus("Vui lòng nhập mật khẩu hiện tại.");
      return;
    }

    if (newValue.length < 6 || newValue.length > 10) {
      setStatus("Mật khẩu mới cần từ 6 đến 10 ký tự.");
      return;
    }

    if (!/^[A-Za-z0-9]+$/.test(newValue)) {
      setStatus("Mật khẩu mới chỉ được gồm chữ cái và chữ số.");
      return;
    }

    if (newValue === oldValue) {
      setStatus("Mật khẩu mới cần khác mật khẩu hiện tại.");
      return;
    }

    if (isTooSimilar(oldValue, newValue)) {
      setStatus("Mật khẩu mới không được quá giống mật khẩu hiện tại.");
      return;
    }

    if (newValue !== confirmValue) {
      setStatus("Xác nhận mật khẩu mới chưa khớp.");
      return;
    }

    try {
      setIsLoading(true);
      await changePassword(oldValue, newValue);
      setStatus("Đã đổi mật khẩu.");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      if (await redirectIfSessionExpired(error, router)) return;
      setStatus(error.message || "Không thể đổi mật khẩu.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Screen style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <ProfileIcon name="chevron-back" size={24} color={colors.ink} />
            </Pressable>
            <Text style={styles.headerTitle}>Bảo mật và đăng nhập</Text>
          </View>
          <Text style={styles.title}>Đổi mật khẩu</Text>
          <Text style={styles.subtitle}>
            Mật khẩu mới cần từ 6 đến 10 ký tự, chỉ gồm chữ cái hoặc chữ số và không quá giống mật khẩu hiện tại.
          </Text>
        </View>

        <View style={styles.card}>
          <AppInput
            label="Mật khẩu hiện tại"
            value={oldPassword}
            onChangeText={setOldPassword}
            secureTextEntry
            editable={!isLoading}
          />
          <AppInput
            label="Mật khẩu mới"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            editable={!isLoading}
          />
          <AppInput
            label="Nhập lại mật khẩu mới"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            editable={!isLoading}
          />
          <AppButton
            title="Đổi mật khẩu"
            onPress={submit}
            loading={isLoading}
          />
          {status ? <Text style={styles.statusText}>{status}</Text> : null}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.surfaceSoft,
    paddingHorizontal: 0,
  },
  content: {
    paddingBottom: sizes.xl,
  },
  header: {
    backgroundColor: colors.white,
    paddingHorizontal: sizes.lg,
    paddingTop: sizes.lg,
    paddingBottom: sizes.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderMuted,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: sizes.sm,
    marginBottom: sizes.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceMuted,
  },
  headerTitle: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "900",
    color: colors.ink,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "900",
    color: colors.ink,
  },
  subtitle: {
    marginTop: sizes.xs,
    fontSize: 15,
    lineHeight: 21,
    color: colors.inkMuted,
  },
  card: {
    marginTop: sizes.md,
    marginHorizontal: sizes.md,
    padding: sizes.lg,
    gap: sizes.md,
    borderRadius: sizes.radiusMd,
    backgroundColor: colors.white,
  },
  statusText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.inkMuted,
  },
});
