import authApi from "@/api/auth";
import Screen from "@/components/common/Screen";
import baseStyles from "@/styles/auth/base.styles";
import loginStyles from "@/styles/auth/login.styles";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, Image, Pressable, Text, TextInput, View } from "react-native";
import { validatePassword, validatePhone } from "@/utils/validation";

const styles = { ...baseStyles, ...loginStyles };
const HEADER_IMAGE = require("../../../assets/images/headface.png");

export default function LoginScreen() {
  const params = useLocalSearchParams();
  const signupIdentifier = useMemo(
    () => (typeof params.identifier === "string" ? params.identifier : ""),
    [params.identifier],
  );

  const [identifier, setIdentifier] = useState(signupIdentifier);
  const [password, setPassword] = useState("");
  const [identifierError, setIdentifierError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    const phoneErr = validatePhone(identifier);
    const passErr = validatePassword(password);

    if (phoneErr || passErr) {
      setIdentifierError(phoneErr);
      setPasswordError(passErr);
      return;
    }

    setIdentifierError("");
    setPasswordError("");

    // Gọi Mock API
    setIsLoading(true);
    try {
      const response = await authApi.login(identifier, password);

      switch (response.code) {
        case "1000":
          Alert.alert("Thành công", "Đăng nhập thành công", [
            { text: "OK", onPress: () => router.replace("/(tabs)/home") },
          ]);
          break;
        case "9995":
          // Chưa được đăng ký
          setIdentifierError("Tài khoản chưa được đăng ký trên hệ thống.");
          break;
        case "1004":
          // Format sai (Lỗi từ phía server fallback)
          setIdentifierError("Thông tin đăng nhập sai định dạng.");
          break;
        case "1002":
          // Không đủ dữ liệu
          setIdentifierError("Vui lòng nhập đầy đủ thông tin.");
          break;
        default:
          Alert.alert("Lỗi", response.message || "Đã có lỗi xảy ra.");
      }
    } catch (error) {
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
          placeholder="Số điện thoại hoặc email"
          placeholderTextColor="#94A3B8"
          value={identifier}
          onChangeText={(text) => {
            setIdentifier(text);
            if (identifierError) setIdentifierError("");
          }}
          keyboardType="default"
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
          editable={!isLoading}
        />
      </View>
      {!!identifierError && (
        <Text style={styles.errorText}>{identifierError}</Text>
      )}

      <View style={styles.inputRow}>
        <TextInput
          placeholder="Mật khẩu"
          placeholderTextColor="#94A3B8"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            if (passwordError) setPasswordError("");
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
        onPress={() => router.push("/(auth)/signup")}
      >
        <Text style={styles.createText}>Tạo tài khoản Facebook mới</Text>
      </Pressable>
    </Screen>
  );
}
