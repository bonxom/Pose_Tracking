import AppInput from "@/components/common/AppInput";
import Screen from "@/components/common/Screen";
import PostCard from "@/components/post/PostCard";
import { DEMO_COURSE } from "@/constants/demo";
import { deleteSavedSearch, getSavedSearches, searchPosts, toggleLike } from "@/repositories/postRepository";
import demoStyles from "@/styles/demo.styles";
import { redirectIfSessionExpired } from "@/utils/screenErrors";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";

const SUGGESTIONS = ["chào điều lệnh", "#exercise_chao_dieu_lenh", "Nguyen Van A", DEMO_COURSE.title];

export default function SearchScreen() {
  const params = useLocalSearchParams();
  const userId = typeof params.userId === "string" ? params.userId : "";
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [savedSearches, setSavedSearches] = useState([]);
  const [statusText, setStatusText] = useState("");

  const runSearch = useCallback(async (value) => {
    try {
      const items = await searchPosts(value, { userId });
      setResults(items);
    } catch (error) {
      if (await redirectIfSessionExpired(error, router)) return;
      setStatusText(error.message || "Không thể tìm kiếm.");
    }
  }, [userId]);

  const loadSavedSearches = useCallback(async () => {
    try {
      setSavedSearches(await getSavedSearches());
    } catch (error) {
      if (await redirectIfSessionExpired(error, router)) return;
      setStatusText(error.message || "Không thể tải lịch sử tìm kiếm.");
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      runSearch(query);
      loadSavedSearches();
    }, [query, loadSavedSearches, runSearch]),
  );

  useEffect(() => {
    runSearch(query);
  }, [query, runSearch]);

  const handleToggleLike = async (post) => {
    try {
      const updated = await toggleLike(post);
      setResults((current) => current.map((item) => (item.id === post.id ? updated : item)));
    } catch (error) {
      if (await redirectIfSessionExpired(error, router)) return;
      setStatusText(error.message || "Không thể thích bài viết.");
    }
  };

  const handleDeleteSavedSearch = async (item) => {
    try {
      await deleteSavedSearch(item.id);
      setSavedSearches((current) => current.filter((saved) => saved.id !== item.id));
    } catch (error) {
      if (await redirectIfSessionExpired(error, router)) return;
      setStatusText(error.message || "Không thể xóa tìm kiếm đã lưu.");
    }
  };

  return (
    <Screen style={demoStyles.screen}>
      <ScrollView contentContainerStyle={demoStyles.scrollContent}>
        <View style={demoStyles.header}>
          <Text style={demoStyles.title}>Tìm kiếm</Text>
          <Text style={demoStyles.subtitle}>
            {userId ? `Tìm trong hồ sơ user_id ${userId}` : "Tìm bài tập, bài nộp, hashtag hoặc giảng viên."}
          </Text>
          <AppInput
            placeholder="Nhập từ khóa..."
            value={query}
            onChangeText={setQuery}
          />
          {statusText ? <Text style={demoStyles.cardText}>{statusText}</Text> : null}
        </View>

        <View style={demoStyles.card}>
          <Text style={demoStyles.cardTitle}>Gợi ý nhanh</Text>
          {SUGGESTIONS.map((item) => (
            <Text key={item} style={demoStyles.cardText} onPress={() => setQuery(item)}>
              {item}
            </Text>
          ))}
        </View>

        <View style={demoStyles.card}>
          <Text style={demoStyles.cardTitle}>Tìm kiếm đã lưu</Text>
          {savedSearches.length ? savedSearches.map((item) => (
            <View key={item.id} style={demoStyles.menuRow}>
              <Text style={demoStyles.cardText} onPress={() => setQuery(item.keyword)}>
                {item.keyword || "(không có từ khóa)"}
              </Text>
              <Text style={demoStyles.cardText} onPress={() => handleDeleteSavedSearch(item)}>
                Xóa
              </Text>
            </View>
          )) : <Text style={demoStyles.cardText}>Chưa có tìm kiếm đã lưu.</Text>}
        </View>

        <Text style={demoStyles.cardTitle}>{results.length} kết quả</Text>
        {results.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onPress={() => router.push(`/post/${post.id}`)}
            onPressComment={() => router.push(`/comment/${post.id}`)}
            onToggleLike={() => handleToggleLike(post)}
            onSubmitExercise={() =>
              router.push({
                pathname: "/post/create",
                params: {
                  mode: "submission",
                  sourcePostId: post.id,
                  courseId: post.courseId,
                  exerciseId: post.exerciseId,
                },
              })
            }
          />
        ))}
      </ScrollView>
    </Screen>
  );
}
