import PostCard from "@/components/post/PostCard";
import { getUserInfo, searchUserProfile } from "@/repositories/userRepository";
import colors from "@/constants/colors";
import sizes from "@/constants/sizes";
import { clearAuthSession } from "@/utils/session";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileSearchScreen() {
  const params = useLocalSearchParams();
  const userId = typeof params.userId === "string" ? params.userId : "";
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    let alive = true;

    getUserInfo(userId)
      .then((user) => {
        if (alive) setProfile(user);
      })
      .catch(() => {
        if (alive) setProfile(null);
      });

    return () => {
      alive = false;
    };
  }, [userId]);

  const runSearch = async () => {
    const normalizedKeyword = keyword.trim();
    if (!normalizedKeyword) {
      setResults([]);
      setError("Nhập từ khóa để tìm trong trang cá nhân.");
      return;
    }

    setLoading(true);
    setError("");
    setHasSearched(true);
    try {
      const items = await searchUserProfile(userId, normalizedKeyword);
      setResults(items);
    } catch (searchError) {
      if (searchError.sessionExpired) {
        await clearAuthSession();
        router.replace("/(auth)/login");
        return;
      }
      setError(searchError.message || "Không thể tìm kiếm trong hồ sơ.");
    } finally {
      setLoading(false);
    }
  };

  const displayName = profile?.displayName || profile?.username || "hồ sơ này";

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconButton}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <View style={styles.inputWrap}>
          <Ionicons name="search-outline" size={20} color={colors.subtext} />
          <TextInput
            value={keyword}
            onChangeText={setKeyword}
            placeholder="Tìm kiếm trong bài viết, ảnh và th..."
            placeholderTextColor={colors.placeholder}
            style={styles.input}
            returnKeyType="search"
            onSubmitEditing={runSearch}
            autoFocus
          />
        </View>
        <Pressable style={styles.searchSubmit} onPress={runSearch} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="search" size={19} color="#FFFFFF" />
          )}
        </Pressable>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <ActivityIndicator color="#0866FF" />
        ) : results.length ? (
          results.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onPress={() => router.push(`/post/${post.id}`)}
              onPressComment={() => router.push(`/comment/${post.id}`)}
            />
          ))
        ) : (
          <View style={styles.emptyIntro}>
            <View style={styles.avatar}>
              {profile?.avatar ? (
                <Image source={{ uri: profile.avatar }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>
                  {String(displayName).trim()[0]?.toUpperCase() || "U"}
                </Text>
              )}
            </View>
            <Text style={styles.emptyTitle}>
              {hasSearched ? "Không tìm thấy kết quả" : "Bạn đang tìm gì à?"}
            </Text>
            <Text style={styles.emptyText}>
              Tìm kiếm trên trang cá nhân của {displayName} để xem bài viết, ảnh và các hoạt động hiển thị khác.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F0F2F5",
  },
  header: {
    minHeight: 54,
    paddingHorizontal: sizes.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#CED0D4",
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  inputWrap: {
    flex: 1,
    minHeight: 34,
    borderRadius: 17,
    paddingHorizontal: sizes.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: sizes.xs,
    backgroundColor: "#F0F2F5",
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
  },
  searchSubmit: {
    width: 38,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0866FF",
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
    paddingTop: 52,
    paddingBottom: sizes.xl,
    gap: sizes.md,
  },
  emptyIntro: {
    alignItems: "center",
    paddingHorizontal: sizes.lg,
  },
  avatar: {
    width: 74,
    height: 74,
    borderRadius: 37,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DDE7F8",
    marginBottom: sizes.lg,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarText: {
    color: "#0866FF",
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
    marginTop: 2,
    fontSize: 13,
    lineHeight: 18,
    color: "#1C1E21",
    textAlign: "center",
  },
});
