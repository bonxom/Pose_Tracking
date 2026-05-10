import AppButton from "@/components/common/AppButton";
import Screen from "@/components/common/Screen";
import PostCard from "@/components/post/PostCard";
import { getFeedPage, toggleLike } from "@/repositories/postRepository";
import homeStyles from "@/styles/home.styles";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Text, View } from "react-native";

export default function HomeScreen() {
  const [posts, setPosts] = useState([]);
  const [sourceLabel, setSourceLabel] = useState("Nguồn dữ liệu: Demo local");
  const [errorText, setErrorText] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadPosts = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorText("");
      const result = await getFeedPage({ index: 0, count: 10 });
      setPosts(result.items || []);
      setSourceLabel(result.sourceLabel || "Nguồn dữ liệu: Demo local");
    } catch (error) {
      console.warn("Failed to load posts:", error);
      setSourceLabel("Nguồn dữ liệu: Server lỗi");
      setErrorText(error.message || "Không thể tải dữ liệu backend.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPosts();
    }, [loadPosts])
  );

  const handleToggleLike = async (post) => {
    try {
      const updatedPost = await toggleLike(post);
      setPosts((prevPosts) =>
        prevPosts.map((p) => (p.id === post.id ? updatedPost : p))
      );
    } catch (error) {
      console.warn("Failed to toggle like:", error);
    }
  };

  const handlePostPress = (postId) => {
    router.push(`/post/${postId}`);
  };

  const handleCommentPress = (postId) => {
    router.push(`/comment/${postId}`);
  };

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

  if (isLoading) {
    return (
      <Screen style={homeStyles.container}>
        <ActivityIndicator size="large" />
      </Screen>
    );
  }

  return (
    <Screen style={homeStyles.container}>
      <View style={{ flex: 1, width: "100%" }}>
        <View style={homeStyles.headerCard}>
          <Text style={homeStyles.title}>IT4788 PoseFeed</Text>
          <Text style={homeStyles.subtitle}>
            Bài tập diễu binh, bài nộp học viên và kết quả chấm tự động
          </Text>
          <Text style={homeStyles.sourceLabel}>{sourceLabel}</Text>
          {errorText ? (
            <Text style={homeStyles.errorText}>{errorText}</Text>
          ) : null}
        </View>

        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PostCard
              post={item}
              onPress={() => handlePostPress(item.id)}
              onToggleLike={() => handleToggleLike(item)}
              onPressComment={() => handleCommentPress(item.id)}
              onSubmitExercise={() => handleSubmitExercise(item)}
            />
          )}
          ItemSeparatorComponent={() => (
            <View style={{ height: 12 }} />
          )}
          ListEmptyComponent={
            <Text style={homeStyles.subtitle}>Không có bài viết nào</Text>
          }
        />

        <View style={homeStyles.buttonSpacing} />

        <AppButton
          title="Tạo bài viết"
          onPress={() => router.push("/post/create")}
        />
      </View>
    </Screen>
  );
}
