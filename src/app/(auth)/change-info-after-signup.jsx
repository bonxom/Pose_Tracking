import authApi from "@/api/auth";
import AppButton from "@/components/common/AppButton";
import AppInput from "@/components/common/AppInput";
import { validateProfileUserName } from "@/repositories/userRepository";
import { registerDeviceForPush } from "@/services/pushNotifications";
import { saveAuthSession } from "@/utils/session";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ChangeInfoAfterSignupScreen() {
  const params = useLocalSearchParams();

  const token = typeof params.token === "string" ? params.token : "";
  const phonenumber =
    typeof params.phonenumber === "string" ? params.phonenumber : "";
  const signupRequestId =
    typeof params.signupRequestId === "string" ? params.signupRequestId : "";
  const role = typeof params.role === "string" ? params.role : "HV";

  const [username, setUsername] = useState("");
  const [height, setHeight] = useState("");
  const [avatar, setAvatar] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [heightError, setHeightError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleBack = () => {
    if (router.canGoBack?.()) {
      router.back();
      return;
    }

    router.replace("/(auth)/signup");
  };

  const handlePickAvatar = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== "granted") {
        Alert.alert(
          "Cần quyền truy cập ảnh",
          "Vui lòng cấp quyền thư viện ảnh để chọn ảnh đại diện.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });

      if (!result.canceled && result.assets?.length) {
        setAvatar(result.assets[0].uri);
      }
    } catch {
      Alert.alert("Lỗi", "Không thể chọn ảnh.");
    }
  };

  const handleSubmit = async () => {
    const normalizedUsername = username.trim();
    const validationUsername = validateProfileUserName(normalizedUsername);
    if (validationUsername) {
      setUsernameError(validationUsername);
      return;
    }
    const normalizedHeight = height.trim();

    let nextHeightError = "";

    if (normalizedHeight && !/^\d+$/.test(normalizedHeight)) {
      nextHeightError = "Chiều cao phải là số.";
    } else if (normalizedHeight) {
      const parsedHeight = Number(normalizedHeight);

      if (parsedHeight < 50 || parsedHeight > 250) {
        nextHeightError = "Chiều cao phải trong khoảng 50-250 cm.";
      }
    }

    if (nextHeightError) {
      setHeightError(nextHeightError);
      return;
    }

    if (!token) {
      Alert.alert("Lỗi", "Thiếu token xác minh. Vui lòng đăng ký lại.");
      return;
    }

    setUsernameError("");
    setHeightError("");
    setIsLoading(true);

    try {
      const optimisticSession = {
        id: phonenumber || `server_user_${Date.now()}`,
        token,
        phonenumber,
        username: normalizedUsername,
        displayName: normalizedUsername,
        role: role || "HV",
        avatar: avatar || "",
        coverImage: "",
        height: normalizedHeight || "",
        source: "server",
        demoMode: false,
        signupRequestId,
        loggedInAt: new Date().toISOString(),
      };

      await saveAuthSession(optimisticSession);
      router.replace("/(tabs)/home");

      void (async () => {
        try {
          const response = await authApi.changeInfoAfterSignup({
            token,
            phonenumber,
            username: normalizedUsername,
            avatar,
            height: normalizedHeight,
            signupRequestId,
          });

          if (response.code !== "1000") {
            Alert.alert("Thông tin người dùng", "Cập nhật thất bại");
            console.warn("Signup profile sync failed:", response);
            return;
          }

          const completedUser = response.data || {};
          const savedToken = completedUser.token || token;
          const savedUsername =
            completedUser.username ||
            completedUser.user_name ||
            completedUser.name ||
            normalizedUsername;

          await saveAuthSession({
            id:
              completedUser.id ||
              completedUser.user_id ||
              phonenumber ||
              "server_user",
            token: savedToken,
            phonenumber: completedUser.phonenumber || phonenumber,
            username: savedUsername,
            displayName: savedUsername,
            role: completedUser.role || role || "HV",
            avatar: completedUser.avatar || avatar || "",
            coverImage:
              completedUser.coverImage || completedUser.cover_image || "",
            height: completedUser.height || normalizedHeight || "",
            source: "server",
            demoMode: false,
            loggedInAt: new Date().toISOString(),
          });

          registerDeviceForPush().catch((error) =>
            console.warn("Cannot register push token:", error),
          );
        } catch (backgroundError) {
          console.warn("Background signup sync failed:", backgroundError);
          Alert.alert("Thông tin người dùng", "Cập nhật thất bại");
        }
      })();
    } catch {
      Alert.alert("Lỗi", "Không thể kết nối đến máy chủ.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Pressable
          style={styles.backButton}
          onPress={handleBack}
          disabled={isLoading}
        >
          <Text style={styles.backText}>←</Text>
        </Pressable>

        <Text style={styles.title}>Hoàn thành thông tin</Text>
        <Text style={styles.subtitle}>
          Nhập tên người dùng. Ảnh đại diện và chiều cao có thể bỏ qua.
        </Text>

        <View style={styles.avatarBlock}>
          <View style={styles.avatarPreview}>
            {avatar ? (
              <Image
                source={{ uri: avatar }}
                style={styles.avatarImage}
                contentFit="cover"
                cachePolicy="memory-disk"
                transition={150}
              />
            ) : (
              <Ionicons name="person-outline" size={42} color="#64748B" />
            )}
          </View>
          <Pressable
            style={styles.pickAvatarButton}
            onPress={handlePickAvatar}
            disabled={isLoading}
          >
            <Ionicons name="images-outline" size={18} color="#0866FF" />
            <Text style={styles.pickAvatarText}>
              {avatar ? "Đổi ảnh" : "Chọn ảnh"}
            </Text>
          </Pressable>
        </View>

        <AppInput
          label="Tên người dùng"
          placeholder="Nhập tên của bạn"
          value={username}
          onChangeText={(value) => {
            setUsername(value);
            if (usernameError) setUsernameError("");
          }}
          editable={!isLoading}
          error={usernameError}
        />

        <AppInput
          label="Chiều cao (cm) - không bắt buộc"
          placeholder="Ví dụ: 170"
          value={height}
          onChangeText={(value) => {
            setHeight(value);
            if (heightError) setHeightError("");
          }}
          keyboardType="number-pad"
          editable={!isLoading}
          error={heightError}
        />

        <AppButton
          title={isLoading ? "Đang xử lý..." : "Hoàn thành"}
          onPress={handleSubmit}
          disabled={isLoading}
          style={styles.submitButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    paddingHorizontal: 18,
    paddingVertical: 24,
    gap: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
  },
  backText: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: "900",
    color: "#0F172A",
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "900",
    color: "#0F172A",
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: "#64748B",
  },
  avatarBlock: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  avatarPreview: {
    width: 112,
    height: 112,
    borderRadius: 56,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: "#E2E8F0",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  pickAvatarButton: {
    minHeight: 36,
    borderRadius: 18,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#E7F0FF",
  },
  pickAvatarText: {
    color: "#0866FF",
    fontSize: 14,
    fontWeight: "900",
  },
  submitButton: {
    marginTop: 8,
  },
});
