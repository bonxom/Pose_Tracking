import authApi from "@/api/auth";
import AppButton from "@/components/common/AppButton";
import baseStyles from "@/styles/auth/base.styles";
import signupStyles from "@/styles/auth/signup.styles";
import {
    validatePassword,
    validatePhoneNumber,
    validateRole,
} from "@/utils/validation";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
    Alert,
    Platform,
    Pressable,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const styles = { ...baseStyles, ...signupStyles };

export default function SignupScreen() {
  const params = useLocalSearchParams();
  const roleParam = typeof params.role === "string" ? params.role : "";
  const usernameParam =
    typeof params.username === "string" ? params.username : "";
  const heightParam = typeof params.height === "string" ? params.height : "";
  const birthdayParam =
    typeof params.birthday === "string" ? params.birthday : "";
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(roleParam); // "GV" hoặc "HV"
  const [phoneNumberError, setPhoneNumberError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [roleError, setRoleError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const showRolePicker = !roleParam;

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/(auth)/login");
  };

  const handleSubmit = async () => {
    const normalizedPhone = phoneNumber.trim();
    const normalizedPassword = password.trim();
    const normalizedRole = role.trim();

    const phoneErr = validatePhoneNumber(normalizedPhone);
    const passErr = validatePassword(normalizedPassword);
    const roleErr = validateRole(normalizedRole);

    if (phoneErr || passErr || roleErr) {
      setPhoneNumberError(phoneErr);
      setPasswordError(passErr);
      setRoleError(roleErr);
      return;
    }

    setPhoneNumberError("");
    setPasswordError("");
    setRoleError("");

    // Gọi API signup
    setIsLoading(true);
    try {
      const response = await authApi.signup({
        phonenumber: normalizedPhone,
        password: normalizedPassword,
        uuid: `uuid_${Date.now()}`,
        role: normalizedRole,
      });
      switch (response.code) {
        case "1000": {
          if (!response.data || !response.data.signupRequestId || !response.data.phonenumber) {
            Alert.alert("Lỗi", "Phản hồi từ máy chủ không hợp lệ.");
            return;
          }

          const navigateToTerms = () => {
            router.push({
              pathname: "/(auth)/signup-terms",
              params: {
                phonenumber: response.data.phonenumber,
                signupRequestId: response.data.signupRequestId,
                username: usernameParam,
                height: heightParam,
                role: normalizedRole,
                birthday: birthdayParam,
              },
            });
          };

          if (Platform.OS === "web") {
            navigateToTerms();
            break;
          }

          navigateToTerms();
          break;
        }
        case "1004":
          setPhoneNumberError("Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.");
          break;
        case "9998":
          setPhoneNumberError("Số điện thoại này đã được đăng ký.");
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
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.welcomeTopBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Quay lại"
            onPress={handleBack}
            style={styles.welcomeBackButton}
          >
            <Text style={styles.welcomeBackText}>←</Text>
          </Pressable>

          <Text style={styles.welcomeTopTitle}>Tạo tài khoản</Text>
        </View>
        <View style={styles.welcomeDivider} />

        <View style={styles.formBody}>
          <Text style={styles.formLabel}>Số điện thoại</Text>
          <View style={styles.inputRow}>
            <TextInput
              placeholder="Nhập số điện thoại"
              placeholderTextColor="#94A3B8"
              value={phoneNumber}
              onChangeText={(text) => {
                setPhoneNumber(text);
                if (phoneNumberError) setPhoneNumberError("");
              }}
              keyboardType="phone-pad"
              editable={!isLoading}
              style={styles.input}
            />
          </View>
          {!!phoneNumberError && (
            <Text style={styles.errorText}>{phoneNumberError}</Text>
          )}

          <Text style={styles.formLabel}>Mật khẩu</Text>
          <View style={styles.inputRow}>
            <TextInput
              placeholder="Nhập mật khẩu"
              placeholderTextColor="#94A3B8"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (passwordError) setPasswordError("");
              }}
              secureTextEntry={!showPassword}
              editable={!isLoading}
              style={[styles.input, { flex: 1 }]}
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
          {!!passwordError && (
            <Text style={styles.errorText}>{passwordError}</Text>
          )}

          <Text style={[styles.formLabel, !showRolePicker && { display: "none" }]}>
            Vai tr�
          </Text>
          <View style={[
            styles.roleContainer,
            !showRolePicker && { display: "none" },
          ]}>
            <Pressable
              style={[
                styles.roleButton,
                role === "HV" && styles.roleButtonActive,
              ]}
              onPress={() => {
                setRole("HV");
                if (roleError) setRoleError("");
              }}
              disabled={isLoading}
            >
              <Text
                style={[
                  styles.roleButtonText,
                  role === "HV" && styles.roleButtonTextActive,
                ]}
              >
                Học viên
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.roleButton,
                role === "GV" && styles.roleButtonActive,
              ]}
              onPress={() => {
                setRole("GV");
                if (roleError) setRoleError("");
              }}
              disabled={isLoading}
            >
              <Text
                style={[
                  styles.roleButtonText,
                  role === "GV" && styles.roleButtonTextActive,
                ]}
              >
                Giáo viên
              </Text>
            </Pressable>
          </View>
          {showRolePicker && !!roleError && (
            <Text style={styles.errorText}>{roleError}</Text>
          )}

          <AppButton
            title={isLoading ? "Đang xử lý..." : "Tiếp"}
            onPress={handleSubmit}
            disabled={isLoading}
            style={styles.ctaButton}
            textStyle={styles.ctaText}
          />
        </View>

        <View style={styles.welcomeBottomHint}>
          <Pressable onPress={() => router.push("/(auth)/login")}>
            <Text style={styles.footerText}>
              Bạn đã có tài khoản?{" "}
              <Text style={styles.footerLink}>Đăng nhập</Text>
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}







