import UserAvatar from "@/components/common/UserAvatar";
import BackIcon from "@/components/icons/BackIcon";
import ProfileIcon from "@/components/icons/ProfileIcon";
import SearchIcon from "@/components/icons/SearchIcon";
import PostCard from "@/components/post/PostCard";
import colors from "@/constants/colors";
import sizes from "@/constants/sizes";
import { toggleLike } from "@/repositories/postRepository";
import { getUserInfo, searchUserProfile } from "@/repositories/userRepository";
import { profileCacheState } from "@/state/profileCacheState";
import { getAuthSession } from "@/utils/session";
import { clearCurrentUserSession } from "@/utils/userSessionCleanup";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { memo, startTransition, useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const SearchPostRow = memo(function SearchPostRow({
  item,
  onPressPost,
  onToggleLike,
  onPressComment,
}) {
  return (
    <PostCard
      post={item}
      onPress={() => onPressPost(item)}
      onToggleLike={() => onToggleLike(item)}
      onPressComment={() => onPressComment(item)}
    />
  );
});

export default function ProfileSearchScreen() {
  const params = useLocalSearchParams();
  const userId = typeof params.userId === "string" ? params.userId : "";
  const initialProfile =
    profileCacheState[userId]?.profile ??
    profileCacheState[""]?.profile ??
    null;

  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState([]);
  const [profile, setProfile] = useState(initialProfile);
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(() => !initialProfile);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const bootstrappedRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      let alive = true;

      const hydrateFromSnapshot = async () => {
        const session = await getAuthSession();
        const ownProfileId = String(
          session?.id || session?.user_id || session?.identifier || "",
        );
        const cacheKey =
          !userId || String(userId) === ownProfileId ? "" : userId;
        const cachedProfile = profileCacheState[cacheKey]?.profile;

        if (alive && cachedProfile) {
          setProfile(cachedProfile);
          setProfileLoading(false);
          return true;
        }

        return false;
      };

      const loadProfile = async () => {
        try {
          if (!bootstrappedRef.current) {
            setProfileLoading(true);
          }
          const user = await getUserInfo(userId);
          if (alive) {
            setProfile(user);
          }
        } catch {
          if (alive) {
            setProfile(null);
          }
        } finally {
          if (alive) {
            setProfileLoading(false);
          }
        }
      };

      const run = async () => {
        const hasSnapshot = await hydrateFromSnapshot();
        if (!alive) return;

        bootstrappedRef.current = true;
        if (hasSnapshot) {
          return;
        }

        await loadProfile();
      };

      run().catch(console.warn);

      return () => {
        alive = false;
      };
    }, [userId]),
  );

  const runSearch = useCallback(async () => {
    const normalizedKeyword = keyword.trim();
    if (!normalizedKeyword) {
      setResults([]);
      setHasSearched(false);
      setError("Nhập từ khóa để tìm trong trang cá nhân.");
      return;
    }

    setLoading(true);
    setError("");
    setHasSearched(true);
    try {
      const items = await searchUserProfile(userId, normalizedKeyword);
      startTransition(() => {
        setResults(items);
      });
    } catch (searchError) {
      if (searchError.sessionExpired) {
        await clearCurrentUserSession();
        router.replace("/(auth)/login");
        return;
      }
      setError(searchError.message || "Không thể tìm kiếm trong hồ sơ.");
    } finally {
      setLoading(false);
    }
  }, [keyword, userId]);

  const handleClearKeyword = useCallback(() => {
    setKeyword("");
    setResults([]);
    setHasSearched(false);
    setError("");
  }, []);

  const handleToggleLike = useCallback(async (post) => {
    try {
      const updated = await toggleLike(post);
      setResults((current) =>
        current.map((item) => (item.id === post.id ? updated : item)),
      );
    } catch (likeError) {
      setError(likeError.message || "Không thể thích bài viết.");
    }
  }, []);

  const handlePressPost = useCallback((post) => {
    router.push(`/post/${post.id}`);
  }, []);

  const handlePressComment = useCallback((post) => {
    router.push(`/post/comment/${post.id}`);
  }, []);

  const renderPostItem = useCallback(
    ({ item }) => (
      <SearchPostRow
        item={item}
        onPressPost={handlePressPost}
        onToggleLike={handleToggleLike}
        onPressComment={handlePressComment}
      />
    ),
    [handlePressComment, handlePressPost, handleToggleLike],
  );

  const keyExtractor = useCallback((item) => item.id, []);
  const displayName =
    profile?.displayName || profile?.username || "trang cá nhân này";

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconButton}>
          <BackIcon size={22} color={colors.text} />
        </Pressable>
        <View style={styles.inputWrap}>
          <SearchIcon size={18} color={colors.subtext} />
          <TextInput
            value={keyword}
            onChangeText={setKeyword}
            placeholder="Tìm kiếm"
            placeholderTextColor={colors.placeholder}
            style={styles.input}
            returnKeyType="search"
            onSubmitEditing={runSearch}
            autoFocus
          />
          {keyword ? (
            <Pressable style={styles.clearButton} onPress={handleClearKeyword}>
              <ProfileIcon name="close" size={18} color={colors.subtext} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {loading && !results.length ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={colors.brand} />
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={keyExtractor}
          renderItem={renderPostItem}
          ListEmptyComponent={
            profileLoading ? (
              <View style={styles.centerState}>
                <ActivityIndicator color={colors.brand} />
              </View>
            ) : (
              <View style={styles.emptyIntro}>
                <UserAvatar uri={profile?.avatar} size={74} />
                <Text style={styles.emptyTitle}>
                  {hasSearched
                    ? "Không tìm thấy kết quả"
                    : "Bạn đang tìm gì à?"}
                </Text>
                <Text style={styles.emptyText}>
                  Tìm kiếm trên trang cá nhân của {displayName} để xem bài viết,
                  ảnh và các hoạt động hiển thị khác.
                </Text>
              </View>
            )
          }
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.page,
  },
  header: {
    minHeight: 56,
    paddingHorizontal: sizes.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderStrong,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  inputWrap: {
    flex: 1,
    minHeight: 40,
    borderRadius: 20,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#EFF2F5",
    position: "relative",
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    paddingRight: 24,
  },
  clearButton: {
    position: "absolute",
    right: 12,
    top: 11,
  },
  errorText: {
    paddingHorizontal: sizes.md,
    paddingTop: sizes.sm,
    color: colors.error,
    fontSize: 13,
    backgroundColor: colors.white,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: sizes.md,
    paddingTop: hasTopPadding(),
    paddingBottom: sizes.xl,
    gap: sizes.md,
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyIntro: {
    alignItems: "center",
    paddingHorizontal: sizes.lg,
    paddingTop: 48,
  },
  avatar: {
    width: 74,
    height: 74,
    borderRadius: 37,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceAccent,
    marginBottom: sizes.lg,
  },
  avatarText: {
    color: colors.brand,
    fontSize: 26,
    fontWeight: "900",
  },
  emptyTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "900",
    color: colors.text,
    textAlign: "center",
  },
  emptyText: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    color: colors.ink,
    textAlign: "center",
  },
});

function hasTopPadding() {
  return 40;
}
