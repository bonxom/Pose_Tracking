import AppButton from "@/components/common/AppButton";
import AppInput from "@/components/common/AppInput";
import {
  getUserInfo,
  updateUserInfo,
  validateProfileUserName,
} from "@/repositories/userRepository";
import colors from "@/constants/colors";
import sizes from "@/constants/sizes";
import { clearAuthSession } from "@/utils/session";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function isLocalAssetUri(value = "") {
  return /^(file|content|asset-library|ph):\/\//i.test(String(value || ""));
}

function initials(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "U";
}

function SectionHeader({ title, actionLabel = "Chỉnh sửa", onPress }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {onPress ? (
        <Pressable style={styles.sectionAction} onPress={onPress}>
          <Text style={styles.sectionActionText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function AvatarPreview({ uri, name, onPick }) {
  return (
    <View style={styles.avatarPreviewWrap}>
      <View style={styles.avatarPreview}>
        {uri ? (
          <Image source={{ uri }} style={styles.previewImage} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarFallbackText}>{initials(name)}</Text>
          </View>
        )}
      </View>
      <Pressable style={styles.cameraFab} onPress={onPick}>
        <Ionicons name="camera" size={20} color="#050505" />
      </Pressable>
    </View>
  );
}

function CoverPreview({ uri, onPick }) {
  return (
    <View style={styles.coverPreview}>
      {uri ? (
        <Image source={{ uri }} style={styles.previewImage} />
      ) : (
        <View style={styles.coverFallback}>
          <Ionicons name="image-outline" size={34} color="#8A8D91" />
        </View>
      )}
      <Pressable style={styles.coverCameraButton} onPress={onPick}>
        <Ionicons name="camera" size={18} color="#050505" />
        <Text style={styles.coverCameraText}>Chỉnh sửa ảnh bìa</Text>
      </Pressable>
    </View>
  );
}

export default function ProfileEditScreen() {
  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [profileLink, setProfileLink] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setStatus("");
    try {
      const user = await getUserInfo();
      setUsername(user.displayName || user.username || "");
      setAvatar(user.avatar || "");
      setCoverImage(user.coverImage || "");
      setDescription(user.description || "");
      setAddress(user.address || user.city || "");
      setProfileLink(user.profileLink || "");
    } catch (error) {
      if (error.sessionExpired) {
        await clearAuthSession();
        router.replace("/(auth)/login");
        return;
      }
      setStatus(error.message || "Không thể tải hồ sơ.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile]),
  );

  const pickImage = async (type) => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== "granted") {
        Alert.alert(
          "Cần quyền truy cập ảnh",
          "Vui lòng cấp quyền thư viện ảnh để chọn ảnh hồ sơ.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: type === "avatar" ? [1, 1] : [16, 9],
        quality: 0.9,
      });

      if (!result.canceled && result.assets?.length) {
        const uri = result.assets[0].uri;
        if (type === "avatar") {
          setAvatar(uri);
        } else {
          setCoverImage(uri);
        }
        setStatus("Ảnh đã chọn đang được preview local. Backend cần URL ảnh hoặc API upload để lưu thật.");
      }
    } catch {
      Alert.alert(
        "Không thể chọn ảnh",
        "Cơ chế chọn ảnh bị lỗi. Upload thật cần backend nhận file hoặc URL ảnh.",
      );
    }
  };

  const saveProfile = async () => {
    const validationError = validateProfileUserName(username);
    if (validationError) {
      setUsernameError(validationError);
      return;
    }

    setSaving(true);
    setStatus("");
    setUsernameError("");
    try {
      const hasLocalImage = isLocalAssetUri(avatar) || isLocalAssetUri(coverImage);
      await updateUserInfo({
        userName: username.trim(),
        avatar,
        coverImage,
        description: description.trim().slice(0, 150),
        address: address.trim(),
        profileLink: profileLink.trim(),
      });

      if (hasLocalImage) {
        Alert.alert(
          "Ảnh chưa upload lên server",
          "set_user_info chỉ nhận avatar/coverImage dạng URL. Ảnh chọn từ máy là URI local nên app giữ ảnh cũ trên server.",
        );
      }
      router.back();
    } catch (error) {
      if (error.sessionExpired) {
        await clearAuthSession();
        router.replace("/(auth)/login");
        return;
      }
      setStatus(error.message || "Không thể cập nhật hồ sơ.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={26} color="#050505" />
        </Pressable>
        <Text style={styles.headerTitle}>Chỉnh sửa trang cá nhân</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator color="#0866FF" />
          <Text style={styles.mutedText}>Đang tải hồ sơ...</Text>
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.section}>
              <SectionHeader title="Ảnh đại diện" onPress={() => pickImage("avatar")} />
              <AvatarPreview uri={avatar} name={username} onPick={() => pickImage("avatar")} />
            </View>

            <View style={styles.section}>
              <SectionHeader title="Ảnh bìa" onPress={() => pickImage("cover")} />
              <CoverPreview uri={coverImage} onPick={() => pickImage("cover")} />
            </View>

            <View style={styles.section}>
              <SectionHeader title="Thông tin cá nhân" />
              <AppInput
                label="Tên người dùng"
                value={username}
                onChangeText={(value) => {
                  setUsername(value);
                  if (usernameError) setUsernameError("");
                }}
                error={usernameError}
                placeholder="Nhập tên người dùng"
                containerStyle={styles.inputGroup}
                style={styles.input}
              />
              <AppInput
                label={`Mô tả bản thân (${description.length}/150)`}
                value={description}
                onChangeText={(value) => setDescription(value.slice(0, 150))}
                placeholder="Viết mô tả ngắn"
                multiline
                containerStyle={styles.inputGroup}
                style={[styles.input, styles.multilineInput]}
              />
              <AppInput
                label="Địa chỉ / tỉnh / thành / quốc gia"
                value={address}
                onChangeText={setAddress}
                placeholder="Ví dụ: Hà Nội, Việt Nam"
                containerStyle={styles.inputGroup}
                style={styles.input}
              />
              <AppInput
                label="Link trang cá nhân"
                value={profileLink}
                onChangeText={setProfileLink}
                placeholder="https://..."
                autoCapitalize="none"
                keyboardType="url"
                containerStyle={styles.inputGroup}
                style={styles.input}
              />
            </View>

            <View style={styles.section}>
              <SectionHeader title="Liên kết ảnh" />
              <Text style={styles.sectionHint}>
                Dùng URL ảnh đã upload để backend lưu avatar và ảnh bìa ổn định.
              </Text>
              <AppInput
                label="avatar URL"
                value={isLocalAssetUri(avatar) ? "" : avatar}
                onChangeText={setAvatar}
                placeholder="https://..."
                autoCapitalize="none"
                keyboardType="url"
                containerStyle={styles.inputGroup}
                style={styles.input}
              />
              <AppInput
                label="coverImage URL"
                value={isLocalAssetUri(coverImage) ? "" : coverImage}
                onChangeText={setCoverImage}
                placeholder="https://..."
                autoCapitalize="none"
                keyboardType="url"
                containerStyle={styles.inputGroup}
                style={styles.input}
              />
            </View>

            {status ? <Text style={styles.statusText}>{status}</Text> : null}
          </ScrollView>

          <View style={styles.footer}>
            <AppButton
              title="Lưu thay đổi"
              onPress={saveProfile}
              loading={saving}
              style={styles.saveButton}
              textStyle={styles.saveButtonText}
            />
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F0F2F5",
  },
  header: {
    minHeight: 56,
    paddingHorizontal: sizes.md,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#DADDE1",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E4E6EB",
  },
  headerTitle: {
    flex: 1,
    marginHorizontal: sizes.sm,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "900",
    color: "#050505",
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    paddingBottom: 96,
    gap: 8,
  },
  section: {
    backgroundColor: colors.white,
    paddingHorizontal: sizes.md,
    paddingTop: sizes.md,
    paddingBottom: sizes.lg,
  },
  sectionHeader: {
    minHeight: 32,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: sizes.md,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "900",
    color: "#050505",
  },
  sectionAction: {
    minHeight: 32,
    paddingHorizontal: sizes.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionActionText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "800",
    color: "#0866FF",
  },
  sectionHint: {
    marginTop: sizes.xs,
    marginBottom: sizes.sm,
    fontSize: 13,
    lineHeight: 18,
    color: "#65676B",
  },
  avatarPreviewWrap: {
    alignSelf: "center",
    marginTop: sizes.md,
    width: 148,
    height: 148,
  },
  avatarPreview: {
    width: 148,
    height: 148,
    borderRadius: 74,
    overflow: "hidden",
    backgroundColor: "#E4E6EB",
    borderWidth: 4,
    borderColor: colors.white,
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  avatarFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DDE7F8",
  },
  avatarFallbackText: {
    fontSize: 42,
    fontWeight: "900",
    color: "#0866FF",
  },
  cameraFab: {
    position: "absolute",
    right: 4,
    bottom: 6,
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E4E6EB",
    borderWidth: 3,
    borderColor: colors.white,
  },
  coverPreview: {
    marginTop: sizes.md,
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#E4E6EB",
  },
  coverFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DADDE1",
  },
  coverCameraButton: {
    position: "absolute",
    right: 10,
    bottom: 10,
    minHeight: 34,
    borderRadius: 17,
    paddingHorizontal: sizes.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.white,
  },
  coverCameraText: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "900",
    color: "#050505",
  },
  inputGroup: {
    marginTop: sizes.md,
  },
  input: {
    minHeight: 48,
    borderRadius: 12,
    borderColor: "#CCD0D5",
    backgroundColor: colors.white,
    fontSize: 16,
    color: "#050505",
  },
  multilineInput: {
    minHeight: 96,
    textAlignVertical: "top",
    paddingTop: sizes.sm,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: sizes.md,
    paddingTop: sizes.sm,
    paddingBottom: sizes.md,
    backgroundColor: colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#DADDE1",
  },
  saveButton: {
    height: 48,
    borderRadius: 8,
    backgroundColor: "#0866FF",
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: "900",
  },
  statusText: {
    marginHorizontal: sizes.md,
    marginBottom: sizes.sm,
    fontSize: 14,
    lineHeight: 20,
    color: colors.subtext,
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: sizes.sm,
    backgroundColor: colors.white,
  },
  mutedText: {
    fontSize: 14,
    color: colors.subtext,
  },
});
