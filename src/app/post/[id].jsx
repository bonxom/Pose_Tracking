import AppButton from "@/components/common/AppButton";
import AppInput from "@/components/common/AppInput";
import Screen from "@/components/common/Screen";
import PostCard from "@/components/post/PostCard";
import { addComment, getComments } from "@/repositories/commentRepository";
import { getPostById, toggleLike } from "@/repositories/postRepository";
import postStyles from "@/styles/post.styles";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, View } from "react-native";

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadPost = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getPostById(id);
      setPost(data);
      const commentResult = await getComments(data || id, { index: 0, count: 50 });
      setComments(commentResult.comments || []);
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
      const updatedPost = await toggleLike(post);
      setPost(updatedPost);
    } catch (error) {
      console.warn("Failed to toggle like:", error);
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

  const handleAddComment = async () => {
    if (!commentText.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập bình luận");
      return;
    }

    const result = await addComment(post, commentText);
    if (result.comment) {
      setComments((current) => [...current, result.comment]);
      setCommentText("");
      const updatedPost = await getPostById(post.id);
      setPost(updatedPost);
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
          onSubmitExercise={handleSubmitExercise}
        />

        <View style={postStyles.divider} />

        <View style={postStyles.inputCard}>
          <Text style={postStyles.slotLabel}>Bình luận ({comments.length})</Text>
          {comments.map((item) => (
            <View key={item.id} style={postStyles.commentCard}>
              <Text style={postStyles.commentAuthor}>{item.authorName}</Text>
              {item.isScoreComment && item.score ? (
                <Text style={postStyles.scoreSummaryTitle}>Điểm: {item.score}/100</Text>
              ) : null}
              <Text style={postStyles.commentText}>{item.content}</Text>
              <Text style={postStyles.commentMeta}>
                {new Date(item.createdAt).toLocaleDateString("vi-VN")}
              </Text>
            </View>
          ))}
          <AppInput
            placeholder="Viết bình luận demo..."
            value={commentText}
            onChangeText={setCommentText}
            multiline
            numberOfLines={3}
            style={postStyles.textArea}
          />
          <AppButton
            title="Gửi bình luận"
            onPress={handleAddComment}
            disabled={!commentText.trim()}
          />
        </View>

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
