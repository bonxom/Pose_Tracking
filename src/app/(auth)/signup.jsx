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
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(roleParam);
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
          const resolvedPhone = response.data?.phonenumber || normalizedPhone;
          const resolvedSignupRequestId =
            response.data?.signupRequestId ||
            response.data?.signup_request_id ||
            resolvedPhone;

          if (!resolvedSignupRequestId || !resolvedPhone) {
            Alert.alert("Lá»—i", "Pháº£n há»“i tá»« mÃ¡y chá»§ khÃ´ng há»£p lá»‡.");
            return;
          }

          router.push({
            pathname: "/(auth)/verify",
            params: {
              phonenumber: resolvedPhone,
              signupRequestId: resolvedSignupRequestId,
              role: normalizedRole,
              token: response.data.token || "",
              verifyCode: response.data.verifyCode || response.data.verify_code || response.data.mock_verify_code || "",
            },
          });
          break;
        }
        case "1004":
          setPhoneNumberError("Dá»¯ liá»‡u khÃ´ng há»£p lá»‡. Vui lÃ²ng kiá»ƒm tra láº¡i.");
          break;
        case "9998":
          setPhoneNumberError("Sá»‘ Ä‘iá»‡n thoáº¡i nÃ y Ä‘Ã£ Ä‘Æ°á»£c Ä‘Äƒng kÃ½.");
          break;
        case "1002":
          setPhoneNumberError("Vui lÃ²ng nháº­p Ä‘áº§y Ä‘á»§ thÃ´ng tin.");
          break;
        default:
          Alert.alert("Lá»—i", response.message || "ÄÃ£ cÃ³ lá»—i xáº£y ra.");
      }
    } catch {
      Alert.alert("Lá»—i", "KhÃ´ng thá»ƒ káº¿t ná»‘i Ä‘áº¿n mÃ¡y chá»§.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.signupHeaderRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Quay lại"
            onPress={handleBack}
            hitSlop={12}
            style={({ pressed }) => [
              styles.signupBackButton,
              pressed && styles.signupBackButtonPressed,
            ]}
          >
            <Ionicons name="chevron-back" size={28} color="#050505" />
          </Pressable>

          <Text style={styles.signupHeaderTitle}>Tạo tài khoản</Text>
        </View>

        <View style={styles.formBody}>
          <Text style={styles.formLabel}>Sá»‘ Ä‘iá»‡n thoáº¡i</Text>
          <View style={styles.inputRow}>
            <TextInput
              placeholder="Nháº­p sá»‘ Ä‘iá»‡n thoáº¡i"
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
          {!!phoneNumberError && <Text style={styles.errorText}>{phoneNumberError}</Text>}

          <Text style={styles.formLabel}>Máº­t kháº©u</Text>
          <View style={styles.inputRow}>
            <TextInput
              placeholder="Nháº­p máº­t kháº©u"
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
              <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                <Ionicons
                  name={showPassword ? "eye-outline" : "eye-off-outline"}
                  size={20}
                  color="#64748B"
                />
              </Pressable>
            )}
          </View>
          {!!passwordError && <Text style={styles.errorText}>{passwordError}</Text>}

          <Text style={[styles.formLabel, !showRolePicker && { display: "none" }]}>
            Vai trÃ²
          </Text>
          <View style={[styles.roleContainer, !showRolePicker && { display: "none" }]}>
            <Pressable
              style={[styles.roleButton, role === "HV" && styles.roleButtonActive]}
              onPress={() => {
                setRole("HV");
                if (roleError) setRoleError("");
              }}
              disabled={isLoading}
            >
              <Text style={[styles.roleButtonText, role === "HV" && styles.roleButtonTextActive]}>
                Há»c viÃªn
              </Text>
            </Pressable>

            <Pressable
              style={[styles.roleButton, role === "GV" && styles.roleButtonActive]}
              onPress={() => {
                setRole("GV");
                if (roleError) setRoleError("");
              }}
              disabled={isLoading}
            >
              <Text style={[styles.roleButtonText, role === "GV" && styles.roleButtonTextActive]}>
                GiÃ¡o viÃªn
              </Text>
            </Pressable>
          </View>
          {showRolePicker && !!roleError && <Text style={styles.errorText}>{roleError}</Text>}

          <AppButton
            title={isLoading ? "Äang xá»­ lÃ½..." : "Tiáº¿p"}
            onPress={handleSubmit}
            disabled={isLoading}
            style={styles.ctaButton}
            textStyle={styles.ctaText}
          />
        </View>

        <View style={styles.welcomeBottomHint}>
          <Pressable onPress={() => router.push("/(auth)/login")}>
            <Text style={styles.footerText}>
              Báº¡n Ä‘Ã£ cÃ³ tÃ i khoáº£n? <Text style={styles.footerLink}>ÄÄƒng nháº­p</Text>
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
