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
import { toggleLike } from "@/repositories/postRepository";
import { queueProfileUpdate } from "@/services/profileUpdateService";
import profileStyles from "@/styles/profile.styles";
import {
  CACHE_KEY_PROFILE,
  getProfileCacheOwnerKey,
  isProfileCacheValidForSession,
  readCache,
  writeCache,
} from "@/utils/cacheStore";
import { profileCacheState } from "@/state/profileCacheState";
import { feedCacheState } from "@/state/feedCacheState";
import { getAuthSession, saveAuthSession, subscribeAuthSession } from "@/utils/session";
import { clearCurrentUserSession } from "@/utils/userSessionCleanup";
import * as ImagePicker from "expo-image-picker";
import * as Linking from "expo-linking";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Clipboard,
  LayoutAnimation,
  Text,
  View,
} from "react-native";
import {
  consumeFinishedUploadedPosts,
  subscribePostUploading,
} from "@/services/postUploadingStore";
import { mergeUniquePosts, mergeRefreshedFeed } from "@/utils/post";

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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
  const canUseProfileCache = !isViewingOtherProfile;

  const [profile, setProfile] = useState(() =>
    canUseProfileCache ? profileCacheState[userId]?.profile ?? null : null,
  );
  const [posts, setPosts] = useState(() =>
    canUseProfileCache ? profileCacheState[userId]?.posts ?? [] : [],
  );
  const [isLoading, setIsLoading] = useState(() =>
    canUseProfileCache ? !profileCacheState[userId] : true,
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasLoadedAllPosts, setHasLoadedAllPosts] = useState(false);
  const [lastId, setLastId] = useState("");
  const [uploadingCards, setUploadingCards] = useState([]);
  const [error, setError] = useState("");
  const { isNoInternet, executeWithInternetCheck } = useInternetFetch();
  const [menuVisible, setMenuVisible] = useState(false);
  const [coverMenuVisible, setCoverMenuVisible] = useState(false);
  const [avatarMenuVisible, setAvatarMenuVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const diskCacheLoadedRef = useRef(false);
  const isQueryingRef = useRef(false);
  const postsRef = useRef(posts);
  useEffect(() => {
    postsRef.current = posts;
  }, [posts]);

  const loadProfile = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setIsRefreshing(true);
      } else if (!profileCacheState[userId]) {
        setIsLoading(true);
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
            if (targetUserId) {
              delete profileCacheState[targetUserId];
            }

            setProfile(user);
            setPosts([]);
            return;
          }

          const postPage = await getUserPosts(user.id, {
            index: 0,
            count: 10,
            includeLocked: isOwnProfile,
          });

          const nextProfile = { ...user, isOwnProfile };
          const nextPosts = postPage.items || [];
          const ownerKey = isOwnProfile
            ? getProfileCacheOwnerKey(session || nextProfile)
            : "";

          const isFallback =
            user.source === "local-fallback" ||
            postPage.source === "local-fallback";

          if (
            isFallback &&
            profileCacheState[userId] &&
            profileCacheState[userId].posts?.length > 0
          ) {
            throw new Error("Không thể kết nối đến máy chủ");
          }

          setProfile(nextProfile);

          const hadCachedPosts =
            profileCacheState[userId] &&
            profileCacheState[userId].posts?.length > 0;
          const mergedPosts =
            !isRefresh && hadCachedPosts
              ? mergeRefreshedFeed(profileCacheState[userId].posts, nextPosts)
              : nextPosts;

          setPosts(mergedPosts);

          if (isOwnProfile) {
            profileCacheState[userId] = buildProfileCacheEntry(
              nextProfile,
              mergedPosts,
              ownerKey,
            );

            if (cacheKey) {
              writeCache(cacheKey, profileCacheState[userId]);
            }

            if (
              session &&
              (session.coverImage !== nextProfile.coverImage ||
                session.avatar !== nextProfile.avatar)
            ) {
              await saveAuthSession({
                ...session,
                avatar: nextProfile.avatar,
                coverImage: nextProfile.coverImage,
              });
            }
          }

          const loadedCount = mergedPosts.length;
          setCurrentPage(Math.max(0, Math.ceil(loadedCount / 10) - 1));
          
          if (isRefresh || !hadCachedPosts) {
            setHasLoadedAllPosts(
              Boolean(postPage.hasMore) === false && nextPosts.length > 0,
            );
          }
          
          isQueryingRef.current = false;
          setLastId(postPage.lastId || "");
        });
      } catch (loadError) {
        if (loadError.sessionExpired) {
          await clearCurrentUserSession();
          router.replace("/(auth)/login");
          return;
        }
        if (!profileCacheState[userId]) {
          setError(loadError.message || "Không thể tải hồ sơ.");
        }
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
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
        posts: profileCacheState[userId]?.posts || postsRef.current,
        ownerKey,
      };
      profileCacheState[userId] = nextCache;
      if (cacheKey) {
        writeCache(cacheKey, nextCache);
      }
      return nextProfile;
    });
  }, [cacheKey, userId]);

  const loadMore = useCallback(async () => {
    if (isQueryingRef.current || hasLoadedAllPosts || posts.length === 0) return;

    try {
      isQueryingRef.current = true;
      setIsLoadingMore(true);
      await wait(1000);
      const nextPage = currentPage + 1;
      const targetUserId = userId || profile?.id || "";
      if (!targetUserId) return;

      let result = await getUserPosts(targetUserId, {
        index: nextPage,
        count: 10,
        lastId,
        includeLocked: profile?.isOwnProfile,
      });

      let nextItems = result.items || [];
      if (nextItems.length === 0 && posts.length >= 10) {
        result = await getUserPosts(targetUserId, {
          index: posts.length,
          count: 10,
          lastId,
          includeLocked: profile?.isOwnProfile,
        });
        nextItems = result.items || [];
      }

      if (nextItems.length === 0) {
        setHasLoadedAllPosts(true);
        return;
      }

      setPosts((current) => {
        const next = mergeUniquePosts(current, nextItems);
        if (profile?.isOwnProfile) {
          if (profileCacheState[userId]) {
            profileCacheState[userId].posts = next;
          }
          if (cacheKey && profileCacheState[userId]) {
            writeCache(cacheKey, profileCacheState[userId]);
          }
        }
        return next;
      });
      setCurrentPage(nextPage);
      setLastId(result.lastId || "");
    } catch (loadError) {
      console.warn("Failed to load more posts on profile:", loadError);
      if (loadError.sessionExpired) {
        await clearCurrentUserSession();
        router.replace("/(auth)/login");
      }
    } finally {
      setIsLoadingMore(false);
      isQueryingRef.current = false;
    }
  }, [
    currentPage,
    hasLoadedAllPosts,
    lastId,
    posts.length,
    profile?.isOwnProfile,
    profile?.id,
    userId,
    cacheKey,
  ]);

  const handleToggleLike = async (post) => {
    try {
      const updatedPost = await toggleLike(post);
      setPosts((prevPosts) => {
        const next = prevPosts.map((p) => (p.id === post.id ? updatedPost : p));
        if (profileCacheState[userId]) {
          profileCacheState[userId].posts = next;
        }
        if (cacheKey) {
          writeCache(cacheKey, profileCacheState[userId]);
        }
        return next;
      });

      // Sync with home feed cache
      if (feedCacheState.homeFeedCache?.length > 0) {
        feedCacheState.homeFeedCache = feedCacheState.homeFeedCache.map((p) =>
          p.id === post.id ? updatedPost : p,
        );
      }
    } catch (error) {
      console.warn("Failed to toggle like:", error);
      if (error.sessionExpired) {
        await clearCurrentUserSession();
        router.replace("/(auth)/login");
      }
    }
  };

  const handleDeletePost = useCallback((postId) => {
    if (!postId) return;

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setPosts((current) => {
      const next = current.filter((item) => item.id !== postId);
      if (profileCacheState[userId]) {
        profileCacheState[userId].posts = next;
      }
      if (cacheKey) {
        writeCache(cacheKey, profileCacheState[userId]);
      }
      return next;
    });

    // Sync with home feed cache
    if (feedCacheState.homeFeedCache?.length > 0) {
      feedCacheState.homeFeedCache = feedCacheState.homeFeedCache.filter(
        (item) => item.id !== postId,
      );
    }
  }, [userId, cacheKey]);

  const handleSubmitExercise = (post) => {
    router.push({
      pathname: "/post/create",
      params: {
        mode: "submission",
        sourcePostId: post.id,
        courseId: post.courseId,
        exerciseId: post.exerciseId,
        teacherId: post.author?.id || "",
      },
    });
  };


  useEffect(() => {
    if (userId) return;

    const unsubscribe = subscribeAuthSession((session) => {
      if (!session) return;
      const ownerKey = getProfileCacheOwnerKey(session);

      setProfile((current) => {
        const nextProfile = mergeOwnProfileWithSession(current || {}, session);
        if (!nextProfile.id && !nextProfile.displayName && !nextProfile.username) {
          return current;
        }

        const nextCache = {
          profile: nextProfile,
          posts: profileCacheState[userId]?.posts || postsRef.current,
          ownerKey,
        };
        profileCacheState[userId] = nextCache;
        if (cacheKey) {
          writeCache(cacheKey, nextCache);
        }
        return nextProfile;
      });
    });

    return () => {
      unsubscribe();
    };
  }, [cacheKey, userId]);

  const uploadSuccessAlertLock = useRef(false);

  const showUploadSuccessAlert = useCallback(() => {
    if (uploadSuccessAlertLock.current) return;

    uploadSuccessAlertLock.current = true;
    Alert.alert("Thông báo", "Bài viết đã được đăng", [
      {
        text: "OK",
        onPress: () => {
          uploadSuccessAlertLock.current = false;
          void loadProfile(true);
        },
        onDismiss: () => {
          uploadSuccessAlertLock.current = false;
          void loadProfile(true);
        },
      },
    ]);
  }, [loadProfile]);

  useEffect(() => {
    if (isViewingOtherProfile) return;

    return subscribePostUploading((nextState) => {
      setUploadingCards(nextState.uploadingCards || []);

      if (!nextState.finishedPosts?.length) {
        return;
      }

      const completedPosts = consumeFinishedUploadedPosts();
      if (!completedPosts.length) {
        return;
      }

      setPosts((current) => {
        const existingIds = new Set(current.map((item) => item.id));
        const uniqueNewPosts = completedPosts.filter(
          (item) => item?.id && !existingIds.has(item.id),
        );

        const next = uniqueNewPosts.length
          ? [...uniqueNewPosts, ...current]
          : current;
        if (profileCacheState[userId]) {
          profileCacheState[userId].posts = next;
        }
        return next;
      });

      showUploadSuccessAlert();
    });
  }, [showUploadSuccessAlert, isViewingOtherProfile, userId]);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const run = async () => {
        if (isViewingOtherProfile) {
          delete profileCacheState[userId];

          setProfile(null);
          setPosts([]);
          setError("");
          setIsLoading(true);

          loadProfile(false);
          return;
        }

        const session = await getAuthSession();
        const ownerKey = getProfileCacheOwnerKey(session);
        const memoryCache = profileCacheState[userId];
        const hasValidMemoryCache =
          memoryCache && memoryCache.ownerKey && memoryCache.ownerKey === ownerKey;

        if (memoryCache && !hasValidMemoryCache) {
          delete profileCacheState[userId];
          setProfile(null);
          setPosts([]);
        }

        await syncOwnProfileFromSession();

        if (!isActive) return;

        if (hasValidMemoryCache) {
          setIsLoading(false);
          loadProfile(false);
          return;
        }

        if (cacheKey && !diskCacheLoadedRef.current) {
          diskCacheLoadedRef.current = true;
          const cached = await readCache(cacheKey);
          if (!isActive) return;

          if (isProfileCacheValidForSession(cached, session)) {
            profileCacheState[userId] = cached;
            setProfile(cached.profile);
            setPosts(cached.posts || []);
          }
          setIsLoading(false);
          loadProfile(false);
          return;
        }

        loadProfile(false);
      };

      run().catch(console.warn);

      return () => {
        isActive = false;
      };
    }, [
      cacheKey,
      loadProfile,
      syncOwnProfileFromSession,
      userId,
      isViewingOtherProfile,
    ]),
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
      profileCacheState[userId] = buildProfileCacheEntry(
        nextProfile,
        profileCacheState[userId]?.posts || posts,
        ownerKey,
      );
      if (cacheKey) {
        writeCache(cacheKey, profileCacheState[userId]);
      }

      await queueProfileUpdate({
        userName: profile.displayName || profile.username,
        avatar: nextProfile.avatar,
        coverImage: nextProfile.coverImage,
      });
    } catch (error) {
      Alert.alert(
        "Không thể cập nhật ảnh",
        error.message || "Vui lòng thử lại.",
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

  if (isLoading && !profile) {
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
      {isNoInternet && posts.length === 0 ? (
        <NoInternetView
          onRefresh={() => loadProfile(true)}
          refreshing={isRefreshing}
          style={{ minHeight: 300 }}
        />
      ) : (
        <ProfilePostsSection
          profile={profile}
          posts={posts}
          loading={isLoading}
          uploadingCards={uploadingCards}
          isRefreshing={isRefreshing}
          isLoadingMore={isLoadingMore}
          hasLoadedAllPosts={hasLoadedAllPosts}
          onRefresh={() => loadProfile(true)}
          onEndReached={loadMore}
          onToggleLike={handleToggleLike}
          onSubmitExercise={handleSubmitExercise}
          onDeletePost={handleDeletePost}
          headerComponent={
            <ProfileHero
              profile={profile}
              isOwnProfile={profile?.isOwnProfile}
              onOpenCoverMenu={() => setCoverMenuVisible(true)}
              onOpenAvatarMenu={() => setAvatarMenuVisible(true)}
              onOpenMenu={() =>
                profile?.isOwnProfile
                  ? router.push("/profile/settings")
                  : setMenuVisible(true)
              }
            />
          }
        />
      )}

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
