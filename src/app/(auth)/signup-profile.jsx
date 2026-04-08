import AppButton from "@/components/common/AppButton";
import baseStyles from "@/styles/auth/base.styles";
import signupStyles from "@/styles/auth/signup.styles";
import { validateRole } from "@/utils/validation";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StatusBar, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const styles = { ...baseStyles, ...signupStyles };

export default function SignupProfileScreen() {
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [height, setHeight] = useState("");
  const [role, setRole] = useState("");

  const [nameError, setNameError] = useState("");
  const [heightError, setHeightError] = useState("");
  const [roleError, setRoleError] = useState("");

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/(auth)/login");
  };

  const handleSubmit = () => {
    const normalizedLast = lastName.trim();
    const normalizedFirst = firstName.trim();
    const normalizedRole = role.trim();
    const normalizedHeight = height.trim();

    let nameErr = "";
    let heightErr = "";

    if (!normalizedLast || !normalizedFirst) {
      nameErr = "Vui lòng nhập đầy đủ họ và tên.";
    }

    if (!normalizedHeight) {
      heightErr = "Chiều cao không được bỏ trống.";
    } else if (!/^\d+$/.test(normalizedHeight)) {
      heightErr = "Chiều cao phải là số.";
    } else {
      const h = parseInt(normalizedHeight, 10);
      if (h < 50 || h > 250) {
        heightErr = "Chiều cao phải trong khoảng 50-250 cm.";
      }
    }

    const roleErr = validateRole(normalizedRole);

    if (nameErr || heightErr || roleErr) {
      setNameError(nameErr);
      setHeightError(heightErr);
      setRoleError(roleErr);
      return;
    }

    setNameError("");
    setHeightError("");
    setRoleError("");

    const username = `${normalizedLast} ${normalizedFirst}`.trim();

    router.push({
      pathname: "/(auth)/signup-birthday",
      params: {
        username,
        height: normalizedHeight,
        role: normalizedRole,
      },
    });
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
          <Text style={styles.welcomeTopTitle}>Thông tin cơ bản</Text>
        </View>
        <View style={styles.welcomeDivider} />

        <View style={styles.formBody}>
          <Text style={styles.formLabel}>Họ</Text>
          <View style={styles.inputRow}>
            <TextInput
              placeholder="Nhập họ"
              placeholderTextColor="#94A3B8"
              value={lastName}
              onChangeText={(text) => {
                setLastName(text);
                if (nameError) setNameError("");
              }}
              style={styles.input}
            />
          </View>

          <Text style={styles.formLabel}>Tên</Text>
          <View style={styles.inputRow}>
            <TextInput
              placeholder="Nhập tên"
              placeholderTextColor="#94A3B8"
              value={firstName}
              onChangeText={(text) => {
                setFirstName(text);
                if (nameError) setNameError("");
              }}
              style={styles.input}
            />
          </View>
          {!!nameError && <Text style={styles.errorText}>{nameError}</Text>}

          <Text style={styles.formLabel}>Chiều cao (cm)</Text>
          <View style={styles.inputRow}>
            <TextInput
              placeholder="Ví dụ: 170"
              placeholderTextColor="#94A3B8"
              value={height}
              onChangeText={(text) => {
                setHeight(text);
                if (heightError) setHeightError("");
              }}
              keyboardType="number-pad"
              style={styles.input}
            />
          </View>
          {!!heightError && <Text style={styles.errorText}>{heightError}</Text>}

          <Text style={styles.formLabel}>Vai trò</Text>
          <View style={styles.roleContainer}>
            <Pressable
              style={[
                styles.roleButton,
                role === "HV" && styles.roleButtonActive,
              ]}
              onPress={() => {
                setRole("HV");
                if (roleError) setRoleError("");
              }}
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
          {!!roleError && <Text style={styles.errorText}>{roleError}</Text>}

          <AppButton
            title="Tiếp"
            onPress={handleSubmit}
            style={styles.ctaButton}
            textStyle={styles.ctaText}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
