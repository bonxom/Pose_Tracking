import AppButton from "@/components/common/AppButton";
import AppInput from "@/components/common/AppInput";
import Screen from "@/components/common/Screen";
import PostCard from "@/components/post/PostCard";
import { addComment, getComments } from "@/repositories/commentRepository";
import { deletePost, editPost, getPostById, reportPost, toggleLike } from "@/repositories/postRepository";
import postStyles from "@/styles/post.styles";
import { getAuthSession } from "@/utils/session";
import { redirectIfSessionExpired } from "@/utils/screenErrors";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, View } from "react-native";

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [session, setSession] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const [reportReason, setReportReason] = useState("");
  const [statusText, setStatusText] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadPost = useCallback(async () => {
    try {
      setIsLoading(true);
      const currentSession = await getAuthSession();
      setSession(currentSession);
      const data = await getPostById(id);
      setPost(data);
      setEditText(data?.content || data?.described || "");
      const commentResult = await getComments(data || id, { index: 0, count: 50 });
      setComments(commentResult.comments || []);
    } catch (error) {
      console.warn("Failed to load post:", error);
      if (await redirectIfSessionExpired(error, router)) return;
      setStatusText(error.message || "Không thể tải bài viết.");
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
      setStatusText(error.message || "Không thể cập nhật lượt thích.");
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
    const normalizedComment = commentText.trim().replace(/[\u0000-\u001F\u007F]/g, " ");
    if (!normalizedComment) {
      Alert.alert("Lỗi", "Vui lòng nhập bình luận");
      return;
    }

    if (normalizedComment.length > 500) {
      Alert.alert("Lỗi", "Bình luận tối đa 500 ký tự.");
      return;
    }

    try {
      const result = await addComment(post, normalizedComment);
      if (result.comment) {
        setComments((current) => [...current, result.comment]);
        setCommentText("");
        const updatedPost = await getPostById(post.id);
        setPost(updatedPost);
      }
    } catch (error) {
      if (await redirectIfSessionExpired(error, router)) return;
      setStatusText(error.message || "Không thể gửi bình luận.");
    }
  };

  const canOwnerEdit = post?.author?.id && session?.id && post.author.id === session.id && session.role === "HV";

  const handleEditPost = async () => {
    if (!editText.trim()) {
      setStatusText("Mô tả bài viết không được bỏ trống.");
      return;
    }

    try {
      const updated = await editPost(post, { content: editText.trim() });
      setPost(updated);
      setIsEditing(false);
      setStatusText("Đã cập nhật bài viết.");
    } catch (error) {
      if (await redirectIfSessionExpired(error, router)) return;
      setStatusText(error.message || "Không thể sửa bài viết.");
    }
  };

  const handleDeletePost = async () => {
    try {
      await deletePost(post);
      router.replace("/(tabs)/home");
    } catch (error) {
      if (await redirectIfSessionExpired(error, router)) return;
      setStatusText(error.message || "Không thể xóa bài viết.");
    }
  };

  const handleReportPost = async () => {
    try {
      await reportPost(post, reportReason.trim() || "Báo cáo nội dung bài viết");
      setReportReason("");
      setStatusText("Đã gửi báo cáo.");
    } catch (error) {
      if (await redirectIfSessionExpired(error, router)) return;
      setStatusText(error.message || "Không thể báo cáo bài viết.");
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

        {statusText ? <Text style={postStyles.warningText}>{statusText}</Text> : null}

        <View style={postStyles.inputCard}>
          <Text style={postStyles.slotLabel}>Thao tác bài viết</Text>
          {canOwnerEdit ? (
            <>
              {isEditing ? (
                <>
                  <AppInput
                    value={editText}
                    onChangeText={setEditText}
                    multiline
                    numberOfLines={4}
                    style={postStyles.textArea}
                  />
                  <View style={postStyles.actionRow}>
                    <AppButton title="Lưu sửa" onPress={handleEditPost} style={postStyles.actionButton} />
                    <AppButton
                      title="Hủy sửa"
                      onPress={() => setIsEditing(false)}
                      style={[postStyles.actionButton, postStyles.secondaryButton]}
                      textStyle={postStyles.secondaryButtonText}
                    />
                  </View>
                </>
              ) : (
                <View style={postStyles.actionRow}>
                  <AppButton title="Sửa bài" onPress={() => setIsEditing(true)} style={postStyles.actionButton} />
                  <AppButton
                    title="Xóa bài"
                    onPress={handleDeletePost}
                    style={[postStyles.actionButton, postStyles.secondaryButton]}
                    textStyle={postStyles.secondaryButtonText}
                  />
                </View>
              )}
            </>
          ) : (
            <>
              <AppInput
                placeholder="Lý do báo cáo..."
                value={reportReason}
                onChangeText={setReportReason}
              />
              <AppButton title="Báo cáo bài viết" onPress={handleReportPost} style={postStyles.actionButton} />
            </>
          )}
        </View>

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
          {post.canComment === false ? (
            <Text style={postStyles.lockedText}>Bài viết này không cho phép bình luận.</Text>
          ) : (
            <>
              <AppInput
                placeholder="Viết bình luận..."
                value={commentText}
                onChangeText={setCommentText}
                multiline
                numberOfLines={3}
                style={postStyles.textArea}
              />
              <Text style={postStyles.slotHint}>{commentText.length}/500 ký tự</Text>
              <AppButton
                title="Gửi bình luận"
                onPress={handleAddComment}
                disabled={!commentText.trim() || commentText.length > 500}
              />
            </>
          )}
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
