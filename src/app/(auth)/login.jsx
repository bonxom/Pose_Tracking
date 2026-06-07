import Screen from "@/components/common/Screen";
import { loginWithPassword } from "@/repositories/authRepository";
import { setDeviceToken } from "@/repositories/settingsRepository";
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
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumberError, setPhoneNumberError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

  const handleLogin = async () => {
    const phoneErr = validatePhoneNumber(phoneNumber);
    const passErr = validatePassword(password);

    if (phoneErr || passErr) {
      setPhoneNumberError(phoneErr);
      setPasswordError(passErr);
      return;
    }

    setPhoneNumberError("");
    setPasswordError("");
    setIsLoading(true);

    try {
      const response = await loginWithPassword(phoneNumber, password);

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
          setPasswordError("Tài khoản chưa được xác thực hoặc không tồn tại.");
          break;
        case "1004":
          setPasswordError("Số điện thoại hoặc mật khẩu không chính xác.");
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
