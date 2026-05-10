import AppButton from "@/components/common/AppButton";
import AppInput from "@/components/common/AppInput";
import Screen from "@/components/common/Screen";
import { addComment, getComments } from "@/repositories/commentRepository";
import { getPostById } from "@/repositories/postRepository";
import postStyles from "@/styles/post.styles";
import { redirectIfSessionExpired } from "@/utils/screenErrors";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Text, View } from "react-native";

export default function CommentScreen() {
  const { postId } = useLocalSearchParams();
  const [comments, setComments] = useState([]);
  const [post, setPost] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadComments = useCallback(async () => {
    try {
      setIsLoading(true);
      const loadedPost = await getPostById(postId);
      setPost(loadedPost);
      const result = await getComments(loadedPost || postId, { index: 0, count: 50 });
      setComments(result.comments || []);
    } catch (error) {
      console.warn("Failed to load comments:", error);
      await redirectIfSessionExpired(error, router);
    } finally {
      setIsLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const handleSubmitComment = async () => {
    const sanitizedComment = commentText.trim().replace(/[\u0000-\u001F\u007F]/g, "");

    if (!sanitizedComment) {
      Alert.alert("Lỗi", "Vui lòng nhập bình luận");
      return;
    }

    if (sanitizedComment.length > 500) {
      Alert.alert("Bình luận quá dài", "Bình luận tối đa 500 ký tự.");
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await addComment(post || postId, sanitizedComment);
      if (result.comment) {
        setComments((prevComments) => [...prevComments, result.comment]);
        setCommentText("");
      }
    } catch (error) {
      console.warn("Failed to add comment:", error);
      if (await redirectIfSessionExpired(error, router)) return;
      Alert.alert("Lỗi", "Không thể đăng bình luận. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Screen style={postStyles.screen}>
        <ActivityIndicator size="large" />
      </Screen>
    );
  }

  return (
    <Screen style={postStyles.screen}>
      <View style={postStyles.screenInner}>
        <Text style={postStyles.title}>Bình luận</Text>
        <Text style={postStyles.subtitle}>
          {comments.length} bình luận
        </Text>

        <FlatList
          data={comments}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={postStyles.commentCard}>
              {item.isScoreComment ? (
                <View
                  style={[
                    postStyles.scoreCommentCard,
                    { borderRadius: 8, padding: 12, marginBottom: 8 },
                  ]}
                >
                  <Text style={postStyles.commentAuthor}>
                    {item.authorName}
                  </Text>
                  {item.score ? (
                    <Text style={{ fontWeight: "700", marginVertical: 4 }}>
                      Điểm: {item.score}/100
                    </Text>
                  ) : null}
                </View>
              ) : null}
              <Text style={postStyles.commentAuthor}>{item.authorName}</Text>
              <Text style={postStyles.commentText}>{item.content}</Text>
              <Text style={postStyles.commentMeta}>
                {new Date(item.createdAt).toLocaleDateString("vi-VN")}
              </Text>
            </View>
          )}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          ListEmptyComponent={
            <Text style={postStyles.subtitle}>Chưa có bình luận nào</Text>
          }
        />

        <View style={{ height: 16 }} />

        {post?.canComment === false ? (
          <Text style={postStyles.subtitle}>Bài viết này đang tắt bình luận.</Text>
        ) : (
          <AppInput
            placeholder="Viết bình luận..."
            value={commentText}
            onChangeText={setCommentText}
            multiline
            numberOfLines={3}
            style={postStyles.textArea}
          />
        )}
        {post?.canComment === false ? null : (
          <Text style={postStyles.slotHint}>{commentText.length}/500 ký tự</Text>
        )}

        <View style={{ height: 12 }} />

        <AppButton
          title={isSubmitting ? "Đang gửi..." : "Gửi bình luận"}
          onPress={handleSubmitComment}
          disabled={isSubmitting || post?.canComment === false}
        />

        <View style={{ height: 12 }} />

        <AppButton
          title="Quay lại"
          onPress={() => router.back()}
          style={[postStyles.actionButton, postStyles.secondaryButton]}
          textStyle={postStyles.secondaryButtonText}
        />
      </View>
    </Screen>
  );
}
