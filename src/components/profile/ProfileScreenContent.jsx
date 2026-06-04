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
  const cacheKey = !userId ? CACHE_KEY_PROFILE : null;

  const [profile, setProfile] = useState(
    () => profileCache[userId]?.profile ?? null,
  );
  const [posts, setPosts] = useState(() => profileCache[userId]?.posts ?? []);
  const [loading, setLoading] = useState(!profileCache[userId]);
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
            profileCache[userId] &&
            profileCache[userId].posts?.length > 0
          ) {
            // Throw a network error so useInternetFetch can catch it
            throw new Error("KhÃ´ng thá»ƒ káº¿t ná»‘i Ä‘áº¿n mÃ¡y chá»§");
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
          profileCache[userId] = buildProfileCacheEntry(
            nextProfile,
            nextPosts,
            ownerKey,
          );
          if (cacheKey) {
            writeCache(cacheKey, profileCache[userId]);
          }
        });
      } catch (loadError) {
        if (loadError.sessionExpired) {
          await clearAuthSession();
          router.replace("/(auth)/login");
          return;
        }
        // Only show error if we have no cached data to display
        if (!profileCache[userId]) {
          setError(loadError.message || "KhÃ´ng thá»ƒ táº£i há»“ sÆ¡.");
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [userId, cacheKey, executeWithInternetCheck],
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
        posts: profileCache[userId]?.posts || posts,
        ownerKey,
      };
      profileCache[userId] = nextCache;
      if (cacheKey) {
        writeCache(cacheKey, nextCache);
      }
      return nextProfile;
    });
  }, [cacheKey, posts, userId]);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const run = async () => {
        if (userId) {
          // If we have in-memory cache, render it instantly then fetch in background
          if (profileCache[userId]) {
            setLoading(false);
            loadProfile(false);
            return;
          }

          loadProfile(false);
          return;
        }

        const session = await getAuthSession();
        const ownerKey = getProfileCacheOwnerKey(session);
        const memoryCache = profileCache[userId];
        const hasValidMemoryCache =
          memoryCache && memoryCache.ownerKey && memoryCache.ownerKey === ownerKey;

        if (memoryCache && !hasValidMemoryCache) {
          delete profileCache[userId];
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
            profileCache[userId] = cached;
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
      Alert.alert("ÄÃ£ sao chÃ©p", profileLink);
    } catch {
      Alert.alert("LiÃªn káº¿t trang cÃ¡ nhÃ¢n", profileLink);
    }
  };

  const pickProfileImage = async (type) => {
    if (!profile) return;

    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== "granted") {
        Alert.alert(
          "Cáº§n quyá»n truy cáº­p áº£nh",
          "Vui lÃ²ng cáº¥p quyá»n thÆ° viá»‡n áº£nh Ä‘á»ƒ chá»n áº£nh.",
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
      profileCache[userId] = buildProfileCacheEntry(
        nextProfile,
        profileCache[userId]?.posts || posts,
        ownerKey,
      );
      if (cacheKey) {
        writeCache(cacheKey, profileCache[userId]);
      }

      await queueProfileUpdate({
        userName: profile.displayName || profile.username,
        avatar: nextProfile.avatar,
        coverImage: nextProfile.coverImage,
      });
    } catch (error) {
      Alert.alert(
        "KhÃ´ng thá»ƒ cáº­p nháº­t áº£nh",
        error.message || "Vui lÃ²ng thá»­ láº¡i.",
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
        <Text style={profileStyles.centerText}>Äang táº£i há»“ sÆ¡...</Text>
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
        <Text style={profileStyles.centerTitle}>KhÃ´ng thá»ƒ táº£i há»“ sÆ¡</Text>
        <Text style={profileStyles.centerText}>{error}</Text>
        <AppButton
          title="Thá»­ láº¡i"
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
        <Text style={profileStyles.centerTitle}>TÃ i khoáº£n khÃ´ng tá»“n táº¡i</Text>
        <Text style={profileStyles.centerText}>
          {profile?.unavailableReason ||
            "Há»“ sÆ¡ nÃ y khÃ´ng kháº£ dá»¥ng hoáº·c báº¡n khÃ´ng cÃ³ quyá»n xem."}
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
            label: "Chá»‰nh sá»­a trang cÃ¡ nhÃ¢n",
            icon: "create-outline",
            onPress: () => router.push("/settings/profile-edit"),
          },
          {
            label: "TÃ¬m kiáº¿m trÃªn trang cÃ¡ nhÃ¢n",
            icon: "search-outline",
            onPress: () =>
              router.push({
                pathname: "/profile/search",
                params: { userId: profile.id },
              }),
          },
          {
            label: "Sao chÃ©p liÃªn káº¿t trang cÃ¡ nhÃ¢n",
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
