import Screen from "@/components/common/Screen";
import PostCard from "@/components/post/PostCard";
import colors from "@/constants/colors";
import {
  getPostById,
  reportPost,
  toggleLike,
} from "@/repositories/postRepository";
import postStyles from "@/styles/post.styles";
import { getAuthSession } from "@/utils/session";
import { redirectIfSessionExpired } from "@/utils/screenErrors";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams();
  const [post, setPost] = useState(null);
  const [session, setSession] = useState(null);
  const [statusText, setStatusText] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const handleGoBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/(tabs)/home");
  }, []);

  const loadPost = useCallback(async () => {
    try {
      setIsLoading(true);
      setStatusText("");
      const currentSession = await getAuthSession();
      setSession(currentSession);
      const data = await getPostById(id);
      setPost(data);
    } catch (error) {
      console.warn("Failed to load post:", error);
      if (await redirectIfSessionExpired(error, router)) return;
      setStatusText("Không thể tải bài viết.");
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
      const updatedPost = await toggleLike(post);
      setPost(updatedPost);
    } catch (error) {
      console.warn("Failed to toggle like:", error);
      if (await redirectIfSessionExpired(error, router)) return;
      setStatusText("Không thể cập nhật lượt thích.");
    }
  };

  const handleSubmitExercise = () => {
    if (!post) return;
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

  const handleNavigateEdit = () => {
    if (!post?.id) return;
    router.push({
      pathname: "/post/edit",
      params: {
        id: post.id,
      },
    });
  };

  const canOwnerEdit =
    post?.author?.id &&
    session?.id &&
    post.author.id === session.id &&
    session.role === "HV";

  const handleDeletePost = () => {
    router.replace("/(tabs)/home");
  };

  const handleReportPost = async () => {
    try {
      await reportPost(post, "Báo cáo nội dung bài viết");
      setStatusText("Đã gửi báo cáo.");
    } catch (error) {
      if (await redirectIfSessionExpired(error, router)) return;
      setStatusText("Không thể báo cáo bài viết.");
    }
  };

  if (isLoading) {
    return (
      <Screen style={[postStyles.screen, postStyles.detailScreen]}>
        <View style={postStyles.detailHeader}>
          <Pressable
            onPress={handleGoBack}
            style={postStyles.detailHeaderButton}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Quay lại"
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={postStyles.detailHeaderTitle}>Bài viết</Text>
          <View style={postStyles.detailHeaderButton} />
        </View>
        <View style={postStyles.detailState}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={postStyles.detailStateText}>Đang tải bài viết...</Text>
        </View>
      </Screen>
    );
  }

  if (!post) {
    return (
      <Screen style={[postStyles.screen, postStyles.detailScreen]}>
        <View style={postStyles.detailHeader}>
          <Pressable
            onPress={handleGoBack}
            style={postStyles.detailHeaderButton}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Quay lại"
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={postStyles.detailHeaderTitle}>Bài viết</Text>
          <View style={postStyles.detailHeaderButton} />
        </View>
        <View style={postStyles.detailState}>
          <Text style={postStyles.detailStateTitle}>
            Không thể hiển thị bài viết
          </Text>
          <Text style={postStyles.detailStateText}>
            Bài viết không tồn tại hoặc bạn không có quyền xem nội dung này.
          </Text>
          <Pressable
            onPress={handleGoBack}
            style={({ pressed }) => [
              postStyles.detailStateButton,
              pressed && postStyles.detailStateButtonPressed,
            ]}
            accessibilityRole="button"
          >
            <Text style={postStyles.detailStateButtonText}>Quay lại</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  return (
    <Screen style={[postStyles.screen, postStyles.detailScreen]}>
      <View style={postStyles.detailHeader}>
        <Pressable
          onPress={handleGoBack}
          style={postStyles.detailHeaderButton}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={postStyles.detailHeaderTitle}>Bài viết</Text>
        <View style={postStyles.detailHeaderButton} />
      </View>
      <ScrollView
        contentContainerStyle={postStyles.detailScrollContent}
        showsVerticalScrollIndicator={false}
      >
        <PostCard
          post={post}
          detail={true}
          flat
          onToggleLike={handleToggleLike}
          onPressComment={() => router.push(`/post/comment/${post.id}`)}
          onSubmitExercise={handleSubmitExercise}
          onEditPost={canOwnerEdit ? handleNavigateEdit : undefined}
          onDeletePost={handleDeletePost}
          onReportPost={handleReportPost}
        />

        {statusText ? (
          <View style={postStyles.detailStatus}>
            <Text style={postStyles.warningText}>{statusText}</Text>
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
