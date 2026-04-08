import AppButton from "@/components/common/AppButton";
import Screen from "@/components/common/Screen";
import PostCard from "@/components/post/PostCard";
import { getPostById, toggleLike } from "@/services/postStore";
import postStyles from "@/styles/post.styles";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams();
  const [post, setPost] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadPost = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getPostById(id);
      setPost(data);
    } catch (error) {
      console.warn("Failed to load post:", error);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadPost();
  }, [loadPost]);

  const handleToggleLike = async () => {
    if (!post) return;
    try {
      const updatedPost = await toggleLike(post.id);
      setPost(updatedPost);
    } catch (error) {
      console.warn("Failed to toggle like:", error);
    }
  };

  if (isLoading) {
    return (
      <Screen style={postStyles.screen}>
        <ActivityIndicator size="large" />
      </Screen>
    );
  }

  if (!post) {
    return (
      <Screen style={postStyles.screen}>
        <Text style={postStyles.title}>Bài viết không tồn tại</Text>
      </Screen>
    );
  }

  return (
    <Screen style={postStyles.screen}>
      <ScrollView
        contentContainerStyle={postStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <PostCard
          post={post}
          detail={true}
          onToggleLike={handleToggleLike}
          onPressComment={() => router.push(`/comment/${post.id}`)}
        />

        <View style={postStyles.divider} />

        <AppButton
          title="Xem bình luận"
          onPress={() => router.push(`/comment/${post.id}`)}
          style={postStyles.actionButton}
        />

        <View style={{ height: 12 }} />

        <AppButton
          title="Quay lại"
          onPress={() => router.back()}
          style={[postStyles.actionButton, postStyles.secondaryButton]}
          textStyle={postStyles.secondaryButtonText}
        />
      </ScrollView>
    </Screen>
  );
}