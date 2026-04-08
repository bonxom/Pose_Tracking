import AppButton from "@/components/common/AppButton";
import Screen from "@/components/common/Screen";
import PostCard from "@/components/post/PostCard";
import { getFeedPage, toggleLike } from "@/services/postStore";
import homeStyles from "@/styles/home.styles";
import { clearAuthSession } from "@/utils/session";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Text, View } from "react-native";

export default function HomeScreen() {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadPosts = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await getFeedPage({ index: 0, count: 10 });
      setPosts(result.items || []);
    } catch (error) {
      console.warn("Failed to load posts:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPosts();
    }, [loadPosts])
  );

  const handleLogout = async () => {
    await clearAuthSession();
    router.replace("/(auth)/login");
  };

  const handleToggleLike = async (postId) => {
    try {
      const updatedPost = await toggleLike(postId);
      setPosts((prevPosts) =>
        prevPosts.map((p) => (p.id === postId ? updatedPost : p))
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
        <Text style={homeStyles.title}>Bảng feed</Text>
        <Text style={homeStyles.subtitle}>Xem các bài viết từ cộng đồng</Text>

        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <PostCard
              post={item}
              onPress={() => handlePostPress(item.id)}
              onToggleLike={() => handleToggleLike(item.id)}
              onPressComment={() => handleCommentPress(item.id)}
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

        <View style={homeStyles.buttonSpacing} />

        <AppButton title="Đăng xuất" onPress={handleLogout} />
      </View>
    </Screen>
  );
}