import Screen from "@/components/common/Screen";
import {
  loginDemoStudent,
  loginDemoTeacher,
  loginWithPassword,
} from "@/repositories/authRepository";
import { setDeviceToken } from "@/repositories/settingsRepository";
import { getDataSourceMode } from "@/repositories/source";
import baseStyles from "@/styles/auth/base.styles";
import loginStyles from "@/styles/auth/login.styles";
import { CACHE_KEY_PROFILE, removeCache } from "@/utils/cacheStore";
import { saveAuthSession } from "@/utils/session";
import { validatePassword, validatePhoneNumber } from "@/utils/validation";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Image,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

const styles = { ...baseStyles, ...loginStyles };
const HEADER_IMAGE = require("../../../assets/images/headface.png");
export default function LoginScreen() {
  const dataSourceMode = getDataSourceMode();
  const isServerMode = dataSourceMode === "server";
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumberError, setPhoneNumberError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showDevFallback, setShowDevFallback] = useState(!isServerMode);

  const persistAndNavigate = async (data) => {
    try {
      await removeCache(CACHE_KEY_PROFILE);
      await saveAuthSession({
        id: data.id,
        token: data.token,
        phonenumber: data.phonenumber,
        identifier: data.identifier || data.phonenumber,
        username: data.username || data.displayName,
        displayName: data.displayName || data.username,
        role: data.role,
        avatar: data.avatar,
        height: data.height,
        handle: data.handle,
        source: data.source,
        demoMode: Boolean(data.demoMode),
        avatarVersion: new Date().toISOString(),
        loggedInAt: new Date().toISOString(),
      });
      if (!data.demoMode) {
        setDeviceToken().catch((error) =>
          console.warn("Cannot register device token:", error),
        );
      }
    } catch (storageError) {
      console.warn("Cannot persist login session:", storageError);
    }

    router.replace("/(tabs)/home");
  };

  const handleDemoLogin = async (loginFn, phone, nextPassword) => {
    setPhoneNumber(phone);
    setPassword(nextPassword);
    setPhoneNumberError("");
    setPasswordError("");
    const response = await loginFn();

    if (response.code === "1000") {
      await persistAndNavigate(response.data);
    }
  };

  const handleLogin = async () => {
    const normalizedPhone = phoneNumber.trim();
    const normalizedPassword = password.trim();
    const phoneErr = validatePhoneNumber(normalizedPhone);
    const passErr = validatePassword(normalizedPassword);

    if (phoneErr || passErr) {
      setPhoneNumberError(phoneErr);
      setPasswordError(passErr);
      return;
    }

    setPhoneNumberError("");
    setPasswordError("");
    setIsLoading(true);

    try {
      const response = await loginWithPassword(
        normalizedPhone,
        normalizedPassword,
      );

      switch (response.code) {
        case "1000": {
          await persistAndNavigate(response.data);

          if (Platform.OS === "web") {
            break;
          }

          Alert.alert("Thành công", "Đăng nhập thành công");
          break;
        }
        case "9995":
          setPhoneNumberError(
            "Backend không xác thực tài khoản này. Dùng nút demo nếu cần chạy local.",
          );
          break;
        case "1004":
          setPhoneNumberError("Số điện thoại hoặc mật khẩu không chính xác.");
          break;
        case "1002":
          setPhoneNumberError("Vui lòng nhập đầy đủ thông tin.");
          break;
        default:
          Alert.alert("Lỗi", response.message || "Đã có lỗi xảy ra.");
      }
    } catch (_error) {
      Alert.alert("Lỗi", "Không thể kết nối đến máy chủ.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Screen style={styles.container}>
      <Image source={HEADER_IMAGE} style={styles.headerImage} />

      <View style={styles.languageRow}>
        <Text style={styles.languageText}>English · 中文(台灣) ·</Text>
        <Text style={styles.languageLink}>Xem thêm...</Text>
      </View>
      <View style={styles.inputRow}>
        <TextInput
          placeholder="Số điện thoại"
          placeholderTextColor="#94A3B8"
          value={phoneNumber}
          onChangeText={(text) => {
            setPhoneNumber(text);
            if (phoneNumberError) {
              setPhoneNumberError("");
            }
          }}
          keyboardType="phone-pad"
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
          editable={!isLoading}
        />
      </View>
      {!!phoneNumberError && (
        <Text style={styles.errorText}>{phoneNumberError}</Text>
      )}

      <View style={styles.inputRow}>
        <TextInput
          placeholder="Mật khẩu"
          placeholderTextColor="#94A3B8"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            if (passwordError) {
              setPasswordError("");
            }
          }}
          secureTextEntry={!showPassword}
          style={[styles.input, { flex: 1 }]}
          editable={!isLoading}
        />
        {password.length > 0 && (
          <Pressable
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeIcon}
          >
            <Ionicons
              name={showPassword ? "eye-outline" : "eye-off-outline"}
              size={20}
              color="#64748B"
            />
          </Pressable>
        )}
      </View>
      {!!passwordError && <Text style={styles.errorText}>{passwordError}</Text>}

      <Pressable
        style={[styles.loginButton, isLoading && { opacity: 0.7 }]}
        onPress={handleLogin}
        disabled={isLoading}
      >
        <Text style={styles.loginText}>
          {isLoading ? "Đang xử lý..." : "Đăng nhập"}
        </Text>
      </Pressable>

      <View style={{ gap: 10, marginTop: 12 }}>
        {!showDevFallback ? (
          <Pressable
            style={[styles.createButton, { borderColor: "#CBD5E1" }]}
            onPress={() => setShowDevFallback(true)}
            disabled={isLoading}
          >
            <Text style={styles.createText}>Developer local fallback</Text>
          </Pressable>
        ) : (
          <>
            <Text style={styles.errorText}>
              Local fallback chỉ dùng khi backend/OTP chưa sẵn sàng.
            </Text>
            <Pressable
              style={[styles.createButton, { borderColor: "#2563EB" }]}
              onPress={() =>
                handleDemoLogin(loginDemoStudent, "0900000001", "123456")
              }
              disabled={isLoading}
            >
              <Text style={styles.createText}>
                Use demo student account · 0900000001 / 123456
              </Text>
            </Pressable>
            <Pressable
              style={[styles.createButton, { borderColor: "#94A3B8" }]}
              onPress={() =>
                handleDemoLogin(loginDemoTeacher, "0900000002", "123456")
              }
              disabled={isLoading}
            >
              <Text style={styles.createText}>
                Use demo teacher account · 0900000002 / 123456
              </Text>
            </Pressable>
          </>
        )}
      </View>

      <Pressable style={styles.forgotRow}>
        <Text style={styles.forgotText}>Quên mật khẩu?</Text>
      </Pressable>

      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>HOẶC</Text>
        <View style={styles.dividerLine} />
      </View>

      <Pressable
        style={styles.createButton}
        onPress={() => router.push("/(auth)/signup-start")}
      >
        <Text style={styles.createText}>Tạo tài khoản mới</Text>
      </Pressable>
    </Screen>
  );
}
