import AppButton from "@/components/common/AppButton";
import PostCard from "@/components/post/PostCard";
import { searchUserProfile } from "@/repositories/userRepository";
import colors from "@/constants/colors";
import sizes from "@/constants/sizes";
import { clearAuthSession } from "@/utils/session";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const runSearch = async () => {
    const normalizedKeyword = keyword.trim();
    if (!normalizedKeyword) {
      setResults([]);
      setError("Nhập từ khóa để tìm trong trang cá nhân.");
      return;
    }

    setLoading(true);
    setError("");
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconButton}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>Tìm kiếm trên trang cá nhân</Text>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.inputWrap}>
          <Ionicons name="search-outline" size={20} color={colors.subtext} />
          <TextInput
            value={keyword}
            onChangeText={setKeyword}
            placeholder="Nhập nội dung bài viết/video"
            placeholderTextColor={colors.placeholder}
            style={styles.input}
            returnKeyType="search"
            onSubmitEditing={runSearch}
          />
        </View>
        <AppButton title="Tìm" onPress={runSearch} loading={loading} style={styles.searchButton} />
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
          <View style={styles.empty}>
            <Ionicons name="search-outline" size={36} color={colors.subtext} />
            <Text style={styles.emptyTitle}>Chưa có kết quả</Text>
            <Text style={styles.emptyText}>Kết quả từ API search với tham số user_id sẽ hiển thị tại đây.</Text>
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
    minHeight: 56,
    paddingHorizontal: sizes.md,
    flexDirection: "row",
    alignItems: "center",
    gap: sizes.sm,
    backgroundColor: colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#CED0D4",
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E4E6EB",
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: "900",
    color: colors.text,
  },
  searchRow: {
    padding: sizes.md,
    flexDirection: "row",
    alignItems: "center",
    gap: sizes.sm,
    backgroundColor: colors.white,
  },
  inputWrap: {
    flex: 1,
    minHeight: 44,
    borderRadius: 22,
    paddingHorizontal: sizes.md,
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
  searchButton: {
    width: 76,
    height: 44,
    borderRadius: 22,
  },
  errorText: {
    paddingHorizontal: sizes.md,
    paddingTop: sizes.sm,
    color: colors.error,
    fontSize: 13,
    backgroundColor: colors.white,
  },
  content: {
    padding: sizes.md,
    gap: sizes.md,
  },
  empty: {
    marginTop: sizes.xl,
    borderRadius: 8,
    backgroundColor: colors.white,
    padding: sizes.xl,
    alignItems: "center",
    gap: sizes.sm,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: colors.text,
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.subtext,
    textAlign: "center",
  },
});
