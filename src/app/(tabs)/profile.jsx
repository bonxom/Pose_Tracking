import Screen from "@/components/common/Screen";
import ProfileHeader from "@/components/profile/ProfileHeader";
import ProfileOptionsSheet from "@/components/profile/ProfileOptionsSheet";
import profileStyles from "@/styles/profile.styles";
import { getAuthSession } from "@/utils/session";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Alert } from "react-native";

export default function ProfileScreen() {
  const [avatarUri, setAvatarUri] = useState(null);
  const [isOptionSheetVisible, setIsOptionSheetVisible] = useState(false);
  const [displayName, setDisplayName] = useState("Người dùng");

  // Load user data from session
  useFocusEffect(
    useCallback(() => {
      const loadUserData = async () => {
        try {
          const session = await getAuthSession();
          if (session && session.username) {
            setDisplayName(session.username);
            if (session.avatar) {
              setAvatarUri(session.avatar);
            }
          }
        } catch (error) {
          console.warn("Cannot load user session:", error);
        }
      };
      loadUserData();
    }, []),
  );

  const requestLibraryPermissionAsync = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permission.status !== "granted") {
      Alert.alert(
        "Cần quyền truy cập thư viện",
        "Vui lòng cấp quyền truy cập thư viện ảnh để chọn ảnh đại diện.",
      );
      return false;
    }

    return true;
  };

  const pickAvatarFromLibraryAsync = async () => {
    const hasPermission = await requestLibraryPermissionAsync();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        setAvatarUri(result.assets[0].uri);
        setIsOptionSheetVisible(false);
      }
    } catch (error) {
      Alert.alert("Lỗi", "Không thể mở thư viện ảnh. Vui lòng thử lại.");
      console.warn("Cannot open image library:", error);
    }
  };

  const requestCameraPermissionAsync = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (permission.status !== "granted") {
      Alert.alert(
        "Cần quyền truy cập camera",
        "Vui lòng cấp quyền truy cập camera để chụp ảnh đại diện mới.",
      );
      return false;
    }

    return true;
  };

  const takeNewAvatarPhotoAsync = async () => {
    const hasPermission = await requestCameraPermissionAsync();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: "images",
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        cameraType: ImagePicker.CameraType.front,
      });

      if (!result.canceled && result.assets.length > 0) {
        setAvatarUri(result.assets[0].uri);
        setIsOptionSheetVisible(false);
      }
    } catch (error) {
      Alert.alert("Lỗi", "Không thể mở camera. Vui lòng thử lại.");
      console.warn("Cannot open camera:", error);
    }
  };

  return (
    <Screen style={profileStyles.screen}>
      <ProfileHeader
        avatarUri={avatarUri}
        displayName={displayName}
        onPressCamera={() => setIsOptionSheetVisible(true)}
      />

      <ProfileOptionsSheet
        visible={isOptionSheetVisible}
        onClose={() => setIsOptionSheetVisible(false)}
        onPressTakePhoto={takeNewAvatarPhotoAsync}
        onPressPickImage={pickAvatarFromLibraryAsync}
      />
    </Screen>
  );
}
