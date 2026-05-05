import AppInput from "@/components/common/AppInput";
import Screen from "@/components/common/Screen";
import PostCard from "@/components/post/PostCard";
import { DEMO_COURSE } from "@/constants/demo";
import { searchPosts, toggleLike } from "@/services/postStore";
import demoStyles from "@/styles/demo.styles";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";

const SUGGESTIONS = ["chào điều lệnh", "#exercise_chao_dieu_lenh", "Nguyen Van A", DEMO_COURSE.title];

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  const runSearch = useCallback(async (value) => {
    const items = await searchPosts(value);
    setResults(items);
  }, []);

  useFocusEffect(
    useCallback(() => {
      runSearch(query);
    }, [query, runSearch]),
  );

  useEffect(() => {
    runSearch(query);
  }, [query, runSearch]);

  const handleToggleLike = async (postId) => {
    const updated = await toggleLike(postId);
    setResults((current) => current.map((item) => (item.id === postId ? updated : item)));
  };

  return (
    <Screen style={demoStyles.screen}>
      <ScrollView contentContainerStyle={demoStyles.scrollContent}>
        <View style={demoStyles.header}>
          <Text style={demoStyles.title}>Tìm kiếm</Text>
          <Text style={demoStyles.subtitle}>Tìm bài tập, bài nộp, hashtag hoặc giảng viên.</Text>
          <AppInput
            placeholder="Nhập từ khóa..."
            value={query}
            onChangeText={setQuery}
          />
        </View>

        <View style={demoStyles.card}>
          <Text style={demoStyles.cardTitle}>Gợi ý nhanh</Text>
          {SUGGESTIONS.map((item) => (
            <Text key={item} style={demoStyles.cardText} onPress={() => setQuery(item)}>
              {item}
            </Text>
          ))}
        </View>

        <Text style={demoStyles.cardTitle}>{results.length} kết quả</Text>
        {results.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onPress={() => router.push(`/post/${post.id}`)}
            onPressComment={() => router.push(`/comment/${post.id}`)}
            onToggleLike={() => handleToggleLike(post.id)}
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
