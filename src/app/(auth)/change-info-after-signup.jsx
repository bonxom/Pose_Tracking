import authApi from "@/api/auth";
import AppButton from "@/components/common/AppButton";
import { saveAuthSession } from "@/utils/session";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
    Alert,
    Image,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const changeInfoStyles = {
  container: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  inputRow: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    marginBottom: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#1E293B",
  },
  errorText: {
    color: "#EF4444",
    fontSize: 12,
    marginBottom: 12,
  },
  avatarContainer: {
    marginVertical: 16,
    alignItems: "center",
  },
  avatarPreview: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    fontSize: 40,
  },
  pickAvatarButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#3B82F6",
    borderRadius: 6,
  },
  pickAvatarText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
};

export default function ChangeInfoAfterSignupScreen() {
  const params = useLocalSearchParams();
  const token = typeof params.token === "string" ? params.token : "";
  const phonenumber =
    typeof params.phonenumber === "string" ? params.phonenumber : "";
  const signupRequestId =
    typeof params.signupRequestId === "string" ? params.signupRequestId : "";

  const [username, setUsername] = useState("");
  const [height, setHeight] = useState("");
  const [avatar, setAvatar] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [heightError, setHeightError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Request image picker permission
    const requestPermission = async () => {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        console.warn("Image picker permission denied");
      }
    };

    requestPermission();
  }, []);

  const handlePickAvatar = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setAvatar(result.assets[0].uri);
      }
    } catch (error) {
      console.warn("Error picking avatar:", error);
      Alert.alert("Lỗi", "Không thể chọn ảnh.");
    }
  };

  const handleSubmit = async () => {
    const normalizedUsername = username.trim();
    const normalizedHeight = height.trim();

    let usernameErr = "";
    let heightErr = "";

    if (!normalizedUsername) {
      usernameErr = "Tên người dùng không được bỏ trống.";
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

    if (usernameErr || heightErr) {
      setUsernameError(usernameErr);
      setHeightError(heightErr);
      return;
    }

    setUsernameError("");
    setHeightError("");

    setIsLoading(true);
    try {
      const response = await authApi.changeInfoAfterSignup({
        token,
        phonenumber,
        username: normalizedUsername,
        height: normalizedHeight,
        avatar: avatar || "",
        signupRequestId,
      });

      switch (response.code) {
        case "1000": {
          try {
            await saveAuthSession({
              id: response.data.id,
              token: response.data.token,
              phonenumber: response.data.phonenumber,
              username: response.data.username,
              role: response.data.role,
              avatar: response.data.avatar,
              height: response.data.height,
              loggedInAt: new Date().toISOString(),
            });
          } catch (storageError) {
            console.warn("Cannot persist session:", storageError);
          }

          const navigateToHome = () =>
            router.replace("/(tabs)/home");

          if (Platform.OS === "web") {
            navigateToHome();
            break;
          }

          Alert.alert("Thành công", "Đăng ký hoàn tất", [
            { text: "OK", onPress: navigateToHome },
          ]);
          break;
        }
        case "1004":
          setUsernameError("Dữ liệu không hợp lệ.");
          break;
        case "1002":
          setUsernameError("Vui lòng nhập đầy đủ thông tin.");
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
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFF" }}>
      <ScrollView contentContainerStyle={changeInfoStyles.container}>
        <Text style={changeInfoStyles.title}>Hoàn thành thông tin</Text>
        <Text style={changeInfoStyles.subtitle}>
          Cập nhật tên, chiều cao và ảnh đại diện của bạn.
        </Text>

        {/* Avatar Picker */}
        <View style={changeInfoStyles.avatarContainer}>
          <View style={changeInfoStyles.avatarPreview}>
            {avatar ? (
              <Image
                source={{ uri: avatar }}
                style={changeInfoStyles.avatarImage}
              />
            ) : (
              <Text style={changeInfoStyles.avatarPlaceholder}>📸</Text>
            )}
          </View>
          <Pressable
            style={changeInfoStyles.pickAvatarButton}
            onPress={handlePickAvatar}
            disabled={isLoading}
          >
            <Text style={changeInfoStyles.pickAvatarText}>
              {avatar ? "Đổi ảnh" : "Chọn ảnh"}
            </Text>
          </Pressable>
        </View>

        {/* Username */}
        <Text style={changeInfoStyles.label}>Tên người dùng</Text>
        <View style={changeInfoStyles.inputRow}>
          <TextInput
            placeholder="Nhập tên của bạn"
            placeholderTextColor="#94A3B8"
            value={username}
            onChangeText={(text) => {
              setUsername(text);
              if (usernameError) setUsernameError("");
            }}
            editable={!isLoading}
            style={changeInfoStyles.input}
          />
        </View>
        {!!usernameError && (
          <Text style={changeInfoStyles.errorText}>{usernameError}</Text>
        )}

        {/* Height */}
        <Text style={changeInfoStyles.label}>Chiều cao (cm)</Text>
        <View style={changeInfoStyles.inputRow}>
          <TextInput
            placeholder="Ví dụ: 170"
            placeholderTextColor="#94A3B8"
            value={height}
            onChangeText={(text) => {
              setHeight(text);
              if (heightError) setHeightError("");
            }}
            keyboardType="number-pad"
            editable={!isLoading}
            style={changeInfoStyles.input}
          />
        </View>
        {!!heightError && (
          <Text style={changeInfoStyles.errorText}>{heightError}</Text>
        )}

        <AppButton
          title={isLoading ? "Đang xử lý..." : "Hoàn thành"}
          onPress={handleSubmit}
          disabled={isLoading}
          style={{ marginTop: 24 }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
