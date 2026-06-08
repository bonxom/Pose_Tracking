import AppButton from "@/components/common/AppButton";
import Screen from "@/components/common/Screen";
import ProfileIcon from "@/components/icons/ProfileIcon";
import colors from "@/constants/colors";
import sizes from "@/constants/sizes";
import { changePassword } from "@/repositories/settingsRepository";
import { redirectIfSessionExpired } from "@/utils/screenErrors";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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

function PasswordField({
  label,
  value,
  onChangeText,
  error,
  visible,
  onToggleVisible,
  editable,
  onFocus,
  onBlur,
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.passwordRow, !!error && styles.passwordRowError]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!visible}
          editable={editable}
          autoCapitalize="none"
          autoCorrect={false}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholderTextColor={colors.placeholder}
          style={styles.passwordInput}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          onPress={onToggleVisible}
          style={styles.eyeButton}
          disabled={!editable}
        >
          <Ionicons
            name={visible ? "eye-outline" : "eye-off-outline"}
            size={20}
            color={colors.inkMuted}
          />
        </Pressable>
      </View>
      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

export default function ChangePasswordScreen() {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef(null);
  const [oldPassword, setOldPassword] = useState("");
  const [confirmOldPassword, setConfirmOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [visibleFields, setVisibleFields] = useState({
    oldPassword: false,
    confirmOldPassword: false,
    newPassword: false,
    confirmPassword: false,
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState("info");
  const [isLoading, setIsLoading] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [focusedField, setFocusedField] = useState("");

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const handleShow = (event) => {
      setKeyboardHeight(Math.max(0, event?.endCoordinates?.height || 0));
    };

    const handleHide = () => {
      setKeyboardHeight(0);
    };

    const showSubscription = Keyboard.addListener(showEvent, handleShow);
    const hideSubscription = Keyboard.addListener(hideEvent, handleHide);

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const extraFocusedPadding =
    focusedField === "confirmPassword" && keyboardHeight > 0 ? sizes.xxl : 0;
  const contentBottomPadding =
    Math.max(sizes.xl, insets.bottom + sizes.md) +
    (keyboardHeight > 0
      ? Math.max(0, keyboardHeight - insets.bottom) + sizes.xs
      : 0) +
    extraFocusedPadding;

  const goBackToSettings = () => {
    if (router.canGoBack?.()) {
      router.back();
      return;
    }

    router.replace("/settings");
  };

  const toggleVisible = (fieldName) => {
    setVisibleFields((current) => ({
      ...current,
      [fieldName]: !current[fieldName],
    }));
  };

  const clearFieldError = (fieldName) => {
    if (fieldErrors[fieldName]) {
      setFieldErrors((current) => ({ ...current, [fieldName]: "" }));
    }
    if (status) {
      setStatus("");
      setStatusType("info");
    }
  };

  const setFieldError = (fieldName, message) => {
    setFieldErrors((current) => ({ ...current, [fieldName]: message }));
    setStatus("");
    setStatusType("info");
  };

  const handleFieldFocus = (fieldName) => {
    setFocusedField(fieldName);

    if (
      fieldName === "confirmPassword" ||
      fieldName === "newPassword" ||
      fieldName === "confirmOldPassword" ||
      fieldName === "oldPassword"
    ) {
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 120);
    }
  };

  const handleFieldBlur = (fieldName) => {
    setFocusedField((current) => (current === fieldName ? "" : current));
  };

  const submit = async () => {
    const oldValue = oldPassword.trim();
    const confirmOldValue = confirmOldPassword.trim();
    const newValue = newPassword.trim();
    const confirmValue = confirmPassword.trim();

    setFieldErrors({});
    setStatus("");
    setStatusType("info");

    if (!oldValue) {
      setFieldError("oldPassword", "Vui lòng nhập mật khẩu hiện tại.");
      return;
    }

    if (!confirmOldValue) {
      setFieldError(
        "confirmOldPassword",
        "Vui lòng nhập lại mật khẩu hiện tại.",
      );
      return;
    }

    if (oldValue !== confirmOldValue) {
      setFieldError(
        "confirmOldPassword",
        "Hai lần nhập mật khẩu hiện tại chưa khớp.",
      );
      return;
    }

    if (!newValue) {
      setFieldError("newPassword", "Vui lòng nhập mật khẩu mới.");
      return;
    }

    if (newValue.length < 6 || newValue.length > 10) {
      setFieldError("newPassword", "Mật khẩu mới cần từ 6 đến 10 ký tự.");
      return;
    }

    if (!/^[A-Za-z0-9]+$/.test(newValue)) {
      setFieldError(
        "newPassword",
        "Mật khẩu mới chỉ được gồm chữ cái và chữ số.",
      );
      return;
    }

    if (newValue === oldValue) {
      setFieldError("newPassword", "Mật khẩu mới cần khác mật khẩu hiện tại.");
      return;
    }

    if (isTooSimilar(oldValue, newValue)) {
      setFieldError(
        "newPassword",
        "Mật khẩu mới không được quá giống mật khẩu hiện tại.",
      );
      return;
    }

    if (!confirmValue) {
      setFieldError("confirmPassword", "Vui lòng nhập lại mật khẩu mới.");
      return;
    }

    if (newValue !== confirmValue) {
      setFieldError("confirmPassword", "Xác nhận mật khẩu mới chưa khớp.");
      return;
    }

    try {
      setIsLoading(true);
      await changePassword(oldValue, newValue);
      setStatus("Đã đổi mật khẩu.");
      setStatusType("success");
      setOldPassword("");
      setConfirmOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      if (await redirectIfSessionExpired(error, router)) return;
      const message = String(error?.message || "").toLowerCase();
      if (
        message.includes("mật khẩu cũ") ||
        message.includes("old password") ||
        message.includes("password")
      ) {
        setFieldError("oldPassword", "Mật khẩu cũ không chính xác.");
      } else {
        setStatus("Không thể đổi mật khẩu. Vui lòng thử lại.");
        setStatusType("error");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Screen style={styles.screen}>
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: contentBottomPadding },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
      >
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Pressable style={styles.backButton} onPress={goBackToSettings}>
              <ProfileIcon name="chevron-back" size={24} color={colors.ink} />
            </Pressable>
            <Text style={styles.headerTitle}>Bảo mật và đăng nhập</Text>
          </View>
          <Text style={styles.title}>Đổi mật khẩu</Text>
          <Text style={styles.subtitle}>
            Nhập mật khẩu hiện tại 2 lần và chọn mật khẩu mới từ 6 đến 10 ký tự,
            chỉ gồm chữ cái hoặc chữ số.
          </Text>
        </View>

        <View style={styles.card}>
          <PasswordField
            label="Mật khẩu hiện tại"
            value={oldPassword}
            onChangeText={(value) => {
              setOldPassword(value);
              clearFieldError("oldPassword");
            }}
            editable={!isLoading}
            error={fieldErrors.oldPassword}
            visible={visibleFields.oldPassword}
            onToggleVisible={() => toggleVisible("oldPassword")}
            onFocus={() => handleFieldFocus("oldPassword")}
            onBlur={() => handleFieldBlur("oldPassword")}
          />
          <PasswordField
            label="Nhập lại mật khẩu hiện tại"
            value={confirmOldPassword}
            onChangeText={(value) => {
              setConfirmOldPassword(value);
              clearFieldError("confirmOldPassword");
            }}
            editable={!isLoading}
            error={fieldErrors.confirmOldPassword}
            visible={visibleFields.confirmOldPassword}
            onToggleVisible={() => toggleVisible("confirmOldPassword")}
            onFocus={() => handleFieldFocus("confirmOldPassword")}
            onBlur={() => handleFieldBlur("confirmOldPassword")}
          />
          <PasswordField
            label="Mật khẩu mới"
            value={newPassword}
            onChangeText={(value) => {
              setNewPassword(value);
              clearFieldError("newPassword");
            }}
            editable={!isLoading}
            error={fieldErrors.newPassword}
            visible={visibleFields.newPassword}
            onToggleVisible={() => toggleVisible("newPassword")}
            onFocus={() => handleFieldFocus("newPassword")}
            onBlur={() => handleFieldBlur("newPassword")}
          />
          <PasswordField
            label="Nhập lại mật khẩu mới"
            value={confirmPassword}
            onChangeText={(value) => {
              setConfirmPassword(value);
              clearFieldError("confirmPassword");
            }}
            editable={!isLoading}
            error={fieldErrors.confirmPassword}
            visible={visibleFields.confirmPassword}
            onToggleVisible={() => toggleVisible("confirmPassword")}
            onFocus={() => handleFieldFocus("confirmPassword")}
            onBlur={() => handleFieldBlur("confirmPassword")}
          />
          <AppButton
            title="Đổi mật khẩu"
            onPress={submit}
            loading={isLoading}
          />
          {status ? (
            <Text
              style={[
                styles.statusText,
                statusType === "error" && styles.statusErrorText,
                statusType === "success" && styles.statusSuccessText,
              ]}
            >
              {status}
            </Text>
          ) : null}
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
  scroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
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
    gap: sizes.sm,
    borderRadius: sizes.radiusMd,
    backgroundColor: colors.white,
  },
  fieldWrap: {
    gap: sizes.xs,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text,
  },
  passwordRow: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: sizes.radiusMd,
    backgroundColor: colors.white,
  },
  passwordRowError: {
    borderColor: colors.error,
  },
  passwordInput: {
    flex: 1,
    minHeight: 50,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  eyeButton: {
    width: 46,
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.error,
  },
  statusText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.inkMuted,
  },
  statusErrorText: {
    color: colors.error,
  },
  statusSuccessText: {
    color: colors.success,
    fontWeight: "700",
  },
});
