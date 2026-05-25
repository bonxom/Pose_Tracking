import AppButton from "@/components/common/AppButton";
import ProfileIcon from "@/components/icons/ProfileIcon";
import ProfileActionSheet from "@/components/profile/ProfileActionSheet";
import ProfileHero from "@/components/profile/ProfileHero";
import ProfileImagePreviewModal from "@/components/profile/ProfileImagePreviewModal";
import ProfilePostsSection from "@/components/profile/ProfilePostsSection";
import colors from "@/constants/colors";
import {
  getUserInfo,
  getUserPosts,
  updateUserInfo,
} from "@/repositories/userRepository";
import profileStyles from "@/styles/profile.styles";
import { clearAuthSession, getAuthSession } from "@/utils/session";
import * as ImagePicker from "expo-image-picker";
import * as Linking from "expo-linking";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Clipboard,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";

export default function ProfileScreenContent({ userId = "" }) {
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [menuVisible, setMenuVisible] = useState(false);
  const [coverMenuVisible, setCoverMenuVisible] = useState(false);
  const [avatarMenuVisible, setAvatarMenuVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState("");

  const loadProfile = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError("");

    try {
      const session = await getAuthSession();
      const targetUserId = userId || "";
      const user = await getUserInfo(targetUserId);
      const isOwnProfile = Boolean(
        user.isOwnProfile ||
          !targetUserId ||
          String(targetUserId) ===
            String(session?.id || session?.user_id || session?.identifier || ""),
      );

      if (user.unavailable) {
        setProfile(user);
        setPosts([]);
        return;
      }

      const postPage = await getUserPosts(user.id, {
        index: 0,
        count: 20,
        includeLocked: isOwnProfile,
      });

      setProfile({ ...user, isOwnProfile });
      setPosts(postPage.items || []);
    } catch (loadError) {
      if (loadError.sessionExpired) {
        await clearAuthSession();
        router.replace("/(auth)/login");
        return;
      }
      setError(loadError.message || "Không thể tải hồ sơ.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      loadProfile(false);
    }, [loadProfile]),
  );

  const profileLink = useMemo(() => {
    const id = profile?.id || userId || "";
    return (
      profile?.profileLink ||
      Linking.createURL(id ? `/profile/${id}` : "/(tabs)/profile")
    );
  }, [profile?.id, profile?.profileLink, userId]);

  const handleCopyLink = async () => {
    try {
      Clipboard.setString(profileLink);
      Alert.alert("Đã sao chép", profileLink);
    } catch {
      Alert.alert("Liên kết trang cá nhân", profileLink);
    }
  };

  const pickProfileImage = async (type) => {
    if (!profile) return;

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== "granted") {
        Alert.alert(
          "Cần quyền truy cập ảnh",
          "Vui lòng cấp quyền thư viện ảnh để chọn ảnh.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: type === "avatar" ? [1, 1] : [16, 9],
        quality: 0.9,
      });

      if (result.canceled || !result.assets?.length) return;

      const uri = result.assets[0].uri;
      const nextProfile =
        type === "avatar"
          ? { ...profile, avatar: uri }
          : { ...profile, coverImage: uri };
      setProfile(nextProfile);

      await updateUserInfo({
        userName: profile.displayName || profile.username,
        avatar: nextProfile.avatar,
        coverImage: nextProfile.coverImage,
      });
    } catch (nextError) {
      Alert.alert(
        "Không thể cập nhật ảnh",
        nextError.message || "Vui lòng thử lại.",
      );
    }
  };

  const handleViewCover = () => {
    if (!profile?.coverImage) {
      Alert.alert("Ảnh bìa", "Hồ sơ hiện chưa có ảnh bìa.");
      return;
    }
    setPreviewImage(profile.coverImage);
  };

  if (loading && !profile) {
    return (
      <View style={profileStyles.centerState}>
        <ActivityIndicator size="large" color={colors.brand} />
        <Text style={profileStyles.centerText}>Đang tải hồ sơ...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={profileStyles.centerState}>
        <ProfileIcon
          name="alert-circle-outline"
          size={42}
          color={colors.error}
        />
        <Text style={profileStyles.centerTitle}>Không thể tải hồ sơ</Text>
        <Text style={profileStyles.centerText}>{error}</Text>
        <AppButton
          title="Thử lại"
          onPress={() => loadProfile(false)}
          style={profileStyles.retryButton}
        />
      </View>
    );
  }

  if (!profile || profile.unavailable) {
    return (
      <View style={profileStyles.centerState}>
        <ProfileIcon
          name="person-circle-outline"
          size={48}
          color={colors.inkMuted}
        />
        <Text style={profileStyles.centerTitle}>Tài khoản không tồn tại</Text>
        <Text style={profileStyles.centerText}>
          {profile?.unavailableReason ||
            "Hồ sơ này không khả dụng hoặc bạn không có quyền xem."}
        </Text>
      </View>
    );
  }

  return (
    <View style={profileStyles.screen}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadProfile(true)}
            tintColor={colors.brand}
          />
        }
        contentContainerStyle={profileStyles.scrollContent}
      >
        <ProfileHero
          profile={profile}
          isOwnProfile={profile.isOwnProfile}
          onOpenCoverMenu={() => setCoverMenuVisible(true)}
          onOpenAvatarMenu={() => setAvatarMenuVisible(true)}
          onOpenMenu={() =>
            profile.isOwnProfile
              ? router.push("/profile/settings")
              : setMenuVisible(true)
          }
        />

        <View style={profileStyles.fbBody}>
          <ProfilePostsSection
            profile={profile}
            posts={posts}
            loading={loading}
          />
        </View>
      </ScrollView>

      <ProfileActionSheet
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        rows={[
          {
            label: "Tìm kiếm trên trang cá nhân",
            icon: "search-outline",
            onPress: () =>
              router.push({
                pathname: "/profile/search",
                params: { userId: profile.id },
              }),
          },
          {
            label: "Sao chép liên kết trang cá nhân",
            icon: "link-outline",
            onPress: handleCopyLink,
          },
        ]}
      />
      <ProfileActionSheet
        visible={coverMenuVisible}
        onClose={() => setCoverMenuVisible(false)}
        rows={[
          {
            label: "Xem ảnh bìa",
            icon: "image-outline",
            onPress: handleViewCover,
          },
          {
            label: "Tải ảnh lên",
            icon: "cloud-upload-outline",
            onPress: () => pickProfileImage("cover"),
          },
        ]}
      />
      <ProfileActionSheet
        visible={avatarMenuVisible}
        onClose={() => setAvatarMenuVisible(false)}
        rows={[
          {
            label: "Chọn ảnh đại diện",
            icon: "images-outline",
            onPress: () => pickProfileImage("avatar"),
          },
        ]}
      />
      <ProfileImagePreviewModal
        uri={previewImage}
        visible={Boolean(previewImage)}
        onClose={() => setPreviewImage("")}
      />
    </View>
  );
}
