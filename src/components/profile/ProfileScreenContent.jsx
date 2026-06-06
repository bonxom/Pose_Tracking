import AppButton from "@/components/common/AppButton";
import NoInternetView from "@/components/common/NoInternetView";
import ProfileIcon from "@/components/icons/ProfileIcon";
import ProfileActionSheet from "@/components/profile/ProfileActionSheet";
import ProfileHero from "@/components/profile/ProfileHero";
import ProfileImagePreviewModal from "@/components/profile/ProfileImagePreviewModal";
import ProfilePostsSection from "@/components/profile/ProfilePostsSection";
import colors from "@/constants/colors";
import { useInternetFetch } from "@/hooks/useNetInfo";
import {
  getUserInfo,
  getUserPosts,
  mergeOwnProfileWithSession,
} from "@/repositories/userRepository";
import { queueProfileUpdate } from "@/services/profileUpdateService";
import profileStyles from "@/styles/profile.styles";
import {
  CACHE_KEY_PROFILE,
  getProfileCacheOwnerKey,
  isProfileCacheValidForSession,
  readCache,
  writeCache,
} from "@/utils/cacheStore";
import { clearAuthSession, getAuthSession } from "@/utils/session";
import * as ImagePicker from "expo-image-picker";
import * as Linking from "expo-linking";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Clipboard,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";

// Module-level in-memory profile cache, keyed by userId ("" = own profile)
let profileCache = {};

function buildProfileCacheEntry(profile, posts, ownerKey = "") {
  return {
    profile,
    posts,
    ownerKey,
  };
}

export default function ProfileScreenContent({ userId = "" }) {
  const isViewingOtherProfile = Boolean(userId);
  const cacheKey = isViewingOtherProfile ? null : CACHE_KEY_PROFILE;
  const ownMemoryCache = isViewingOtherProfile ? null : profileCache[""];

  const [profile, setProfile] = useState(
    () => ownMemoryCache?.profile ?? null,
  );
  const [posts, setPosts] = useState(() => ownMemoryCache?.posts ?? []);
  const [loading, setLoading] = useState(!ownMemoryCache);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const { isNoInternet, executeWithInternetCheck } = useInternetFetch();
  const [menuVisible, setMenuVisible] = useState(false);
  const [coverMenuVisible, setCoverMenuVisible] = useState(false);
  const [avatarMenuVisible, setAvatarMenuVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const diskCacheLoadedRef = useRef(false);

  const loadProfile = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      }
      setError("");

      try {
        await executeWithInternetCheck(async () => {
          const session = await getAuthSession();
          const targetUserId = userId || "";
          const user = await getUserInfo(targetUserId);
          const isOwnProfile = Boolean(
            user.isOwnProfile ||
            !targetUserId ||
            String(targetUserId) ===
              String(
                session?.id || session?.user_id || session?.identifier || "",
              ),
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

          const nextProfile = { ...user, isOwnProfile };
          const nextPosts = postPage.items || [];
          const ownerKey = isOwnProfile
            ? getProfileCacheOwnerKey(session || nextProfile)
            : "";

          // If the network fetch failed and returned empty local mock data,
          // BUT we already have cached posts in memory, ignore the mock data
          // and let the catch block (or executeWithInternetCheck) handle the error state.
          const isFallback =
            user.source === "local-fallback" ||
            postPage.source === "local-fallback";

          if (
            isFallback &&
            !isViewingOtherProfile &&
            profileCache[""] &&
            profileCache[""].posts?.length > 0
          ) {
            // Throw a network error so useInternetFetch can catch it
            throw new Error("Không thể kết nối đến máy chủ");
          }

          // Always update profile after a successful fetch so bio/cover/name
          // changes appear immediately when returning from edit screen.
          setProfile(nextProfile);
          setPosts((prev) => {
            const prevIds = prev.map((p) => p.id).join(",");
            const nextIds = nextPosts.map((p) => p.id).join(",");
            return prevIds !== nextIds ? nextPosts : prev;
          });

          // Persist to memory + disk
          if (!isViewingOtherProfile) {
            profileCache[""] = buildProfileCacheEntry(
              nextProfile,
              nextPosts,
              ownerKey,
            );

            if (cacheKey) {
              writeCache(cacheKey, profileCache[""]);
            }
          }
        });
      } catch (loadError) {
        if (loadError.sessionExpired) {
          await clearAuthSession();
          router.replace("/(auth)/login");
          return;
        }
        // Only show error if we have no cached data to display
        if (isViewingOtherProfile || !profileCache[""]) {
          setError(loadError.message || "Không thể tải hồ sơ.");
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [isViewingOtherProfile, userId, cacheKey, executeWithInternetCheck],
  );

  const syncOwnProfileFromSession = useCallback(async () => {
    if (userId) return;

    const session = await getAuthSession();
    if (!session) return;
    const ownerKey = getProfileCacheOwnerKey(session);

    setProfile((current) => {
      const nextProfile = mergeOwnProfileWithSession(current || {}, session);
      if (!nextProfile.id && !nextProfile.displayName && !nextProfile.username) {
        return current;
      }

      const nextCache = {
        profile: nextProfile,
        posts: profileCache[""]?.posts || [],
        ownerKey,
      };
      profileCache[""] = nextCache;
      if (cacheKey) {
        writeCache(cacheKey, nextCache);
      }
      return nextProfile;
    });
  }, [cacheKey, userId]);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const run = async () => {
        if (userId) {
          setProfile((current) => (current ? null : current));
          setPosts((current) => (current.length ? [] : current));
          setLoading(true);
          loadProfile(false);
          return;
        }

        const session = await getAuthSession();
        const ownerKey = getProfileCacheOwnerKey(session);
        const memoryCache = profileCache[""];
        const hasValidMemoryCache =
          memoryCache && memoryCache.ownerKey && memoryCache.ownerKey === ownerKey;

        if (memoryCache && !hasValidMemoryCache) {
          delete profileCache[""];
          setProfile(null);
          setPosts([]);
        }

        await syncOwnProfileFromSession();

        if (!isActive) return;

        // If we have valid in-memory cache, render it instantly then fetch in background
        if (hasValidMemoryCache) {
          setLoading(false);
          loadProfile(false);
          return;
        }

        // No valid in-memory cache: try disk first, then fetch
        if (cacheKey && !diskCacheLoadedRef.current) {
          diskCacheLoadedRef.current = true;
          const cached = await readCache(cacheKey);
          if (!isActive) return;

          if (isProfileCacheValidForSession(cached, session)) {
            profileCache[""] = cached;
            setProfile(cached.profile);
            setPosts(cached.posts || []);
          }
          setLoading(false);
          loadProfile(false);
          return;
        }

        loadProfile(false);
      };

      run().catch(console.warn);

      return () => {
        isActive = false;
      };
    }, [cacheKey, loadProfile, syncOwnProfileFromSession, userId]),
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
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
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
      const ownerKey = getProfileCacheOwnerKey(nextProfile);
      if (!isViewingOtherProfile) {
        profileCache[""] = buildProfileCacheEntry(
          nextProfile,
          profileCache[""]?.posts || posts,
          ownerKey,
        );

        if (cacheKey) {
          writeCache(cacheKey, profileCache[""]);
        }
      }

      await queueProfileUpdate({
        userName: profile.displayName || profile.username,
        avatar: nextProfile.avatar,
        coverImage: nextProfile.coverImage,
      });
    } catch (error) {
      Alert.alert(
        "Lỗi",
        error.message || "Không thể cập nhật ảnh đại diện.",
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

  const handleViewAvatar = () => {
    if (!profile?.avatar) {
      Alert.alert(
        "Ảnh đại diện",
        "Hồ sơ hiện chưa có ảnh đại diện.",
      );
      return;
    }
    setPreviewImage(profile.avatar);
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
          {isNoInternet && posts.length === 0 ? (
            <NoInternetView
              onRefresh={() => loadProfile(true)}
              refreshing={refreshing}
              style={{ minHeight: 300 }}
            />
          ) : (
            <ProfilePostsSection
              profile={profile}
              posts={posts}
              loading={loading}
            />
          )}
        </View>
      </ScrollView>

      <ProfileActionSheet
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        rows={[
          {
            label: "Chỉnh sửa trang cá nhân",
            icon: "create-outline",
            onPress: () => router.push("/settings/profile-edit"),
          },
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
            label: "Xem ảnh đại diện",
            icon: "image-outline",
            onPress: handleViewAvatar,
          },
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
