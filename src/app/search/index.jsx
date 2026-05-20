import AppInput from "@/components/common/AppInput";
import Screen from "@/components/common/Screen";
import PostCard from "@/components/post/PostCard";
import { DEMO_COURSE } from "@/constants/demo";
import {
  deleteSavedSearch,
  getSavedSearches,
  searchPosts,
  toggleLike,
} from "@/repositories/postRepository";
import demoStyles from "@/styles/demo.styles";
import { redirectIfSessionExpired } from "@/utils/screenErrors";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";

const SUGGESTIONS = [
  "chao dieu lenh",
  "#exercise_chao_dieu_lenh",
  "Nguyen Van A",
  DEMO_COURSE.title,
];

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
      setStatusText(error.message || "Khong the tim kiem.");
    }
  }, [userId]);

  const loadSavedSearches = useCallback(async () => {
    try {
      setSavedSearches(await getSavedSearches());
    } catch (error) {
      if (await redirectIfSessionExpired(error, router)) return;
      setStatusText(error.message || "Khong the tai lich su tim kiem.");
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      runSearch(query);
      loadSavedSearches();
    }, [loadSavedSearches, query, runSearch]),
  );

  useEffect(() => {
    runSearch(query);
  }, [query, runSearch]);

  const handleToggleLike = async (post) => {
    try {
      const updated = await toggleLike(post);
      setResults((current) =>
        current.map((item) => (item.id === post.id ? updated : item)),
      );
    } catch (error) {
      if (await redirectIfSessionExpired(error, router)) return;
      setStatusText(error.message || "Khong the thich bai viet.");
    }
  };

  const handleDeleteSavedSearch = async (item) => {
    try {
      await deleteSavedSearch(item.id);
      setSavedSearches((current) =>
        current.filter((saved) => saved.id !== item.id),
      );
    } catch (error) {
      if (await redirectIfSessionExpired(error, router)) return;
      setStatusText(error.message || "Khong the xoa tim kiem da luu.");
    }
  };

  return (
    <Screen style={demoStyles.screen}>
      <ScrollView contentContainerStyle={demoStyles.scrollContent}>
        <View style={demoStyles.header}>
          <Text style={demoStyles.title}>Tim kiem</Text>
          <Text style={demoStyles.subtitle}>
            {userId
              ? `Tim trong ho so user_id ${userId}`
              : "Tim bai tap, bai nop, hashtag hoac giang vien."}
          </Text>
          <AppInput
            placeholder="Nhap tu khoa..."
            value={query}
            onChangeText={setQuery}
          />
          {statusText ? (
            <Text style={demoStyles.cardText}>{statusText}</Text>
          ) : null}
        </View>

        <View style={demoStyles.card}>
          <Text style={demoStyles.cardTitle}>Goi y nhanh</Text>
          {SUGGESTIONS.map((item) => (
            <Text
              key={item}
              style={demoStyles.cardText}
              onPress={() => setQuery(item)}
            >
              {item}
            </Text>
          ))}
        </View>

        <View style={demoStyles.card}>
          <Text style={demoStyles.cardTitle}>Tim kiem da luu</Text>
          {savedSearches.length ? (
            savedSearches.map((item) => (
              <View key={item.id} style={demoStyles.menuRow}>
                <Text
                  style={demoStyles.cardText}
                  onPress={() => setQuery(item.keyword)}
                >
                  {item.keyword || "(khong co tu khoa)"}
                </Text>
                <Text
                  style={demoStyles.cardText}
                  onPress={() => handleDeleteSavedSearch(item)}
                >
                  Xoa
                </Text>
              </View>
            ))
          ) : (
            <Text style={demoStyles.cardText}>Chua co tim kiem da luu.</Text>
          )}
        </View>

        <Text style={demoStyles.cardTitle}>{results.length} ket qua</Text>
        {results.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onPress={() => router.push(`/post/${post.id}`)}
            onPressComment={() => router.push(`/post/comment/${post.id}`)}
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
