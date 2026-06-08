import Screen from "@/components/common/Screen";
import CommentComponent from "@/components/post/CommentComponent";
import CommentComposer from "@/components/post/CommentComposer";
import PostCard from "@/components/post/PostCard";
import SkeletonComment from "@/components/post/SkeletonComment";
import {
  dedupeCommentsById,
  validateCommentText,
} from "@/components/post/commentThreadUtils";
import colors from "@/constants/colors";
import { addComment, getComments } from "@/repositories/commentRepository";
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
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

const COMMENT_PREVIEW_COUNT = 3;

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams();
  const [post, setPost] = useState(null);
  const [session, setSession] = useState(null);
  const [statusText, setStatusText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [comments, setComments] = useState([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [commentError, setCommentError] = useState("");
  const [hasMoreComments, setHasMoreComments] = useState(false);
  const [isCommentBlocked, setIsCommentBlocked] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const inlineCommentInputRef = useRef(null);

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
      setCommentError("");
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

  const openComments = useCallback(() => {
    if (!post?.id) return;
    router.push(`/post/comment/${post.id}`);
  }, [post?.id]);

  const loadCommentPreview = useCallback(async () => {
    if (!post?.id) {
      setComments([]);
      setHasMoreComments(false);
      setIsCommentBlocked(false);
      return;
    }

    try {
      setIsLoadingComments(true);
      setCommentError("");
      setIsCommentBlocked(false);

      const result = await getComments(post, {
        index: 0,
        count: COMMENT_PREVIEW_COUNT,
      });
      const loadedComments = Array.isArray(result?.comments)
        ? dedupeCommentsById(result.comments)
        : [];
      const commentCount = Number(post?.commentCount) || 0;
      const blocked = result?.isBlocked === true;

      setComments(loadedComments);
      setIsCommentBlocked(blocked);
      setHasMoreComments(
        result?.hasOlder === true ||
          commentCount > loadedComments.length ||
          loadedComments.length >= COMMENT_PREVIEW_COUNT,
      );
    } catch (error) {
      console.warn("Failed to load comment preview:", error);
      if (await redirectIfSessionExpired(error, router)) return;
      setCommentError("Không thể tải bình luận. Vui lòng thử lại.");
      setComments([]);
      setHasMoreComments(false);
      setIsCommentBlocked(false);
    } finally {
      setIsLoadingComments(false);
    }
  }, [post]);

  useEffect(() => {
    loadPost();
  }, [loadPost]);

  useEffect(() => {
    loadCommentPreview();
  }, [loadCommentPreview]);

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

  const handleSubmitInlineComment = async () => {
    if (!post) return;

    const { text: sanitizedComment, error } = validateCommentText(commentText);

    if (error) {
      setCommentError(error);
      inlineCommentInputRef.current?.focus();
      return;
    }

    try {
      setIsSubmittingComment(true);
      setCommentError("");
      const result = await addComment(post, sanitizedComment);

      if (result?.comment) {
        setComments((prevComments) =>
          dedupeCommentsById([result.comment, ...prevComments]),
        );
        setPost((currentPost) =>
          currentPost
            ? {
                ...currentPost,
                commentCount: (Number(currentPost.commentCount) || 0) + 1,
              }
            : currentPost,
        );
        setCommentText("");
        inlineCommentInputRef.current?.focus();
      }
    } catch (error) {
      console.warn("Failed to add inline comment:", error);
      if (await redirectIfSessionExpired(error, router)) return;
      setCommentError("Không thể đăng bình luận. Vui lòng thử lại.");
    } finally {
      setIsSubmittingComment(false);
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
  const visibleCommentCount = Math.max(
    Number(post?.commentCount) || 0,
    comments.length,
  );

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
        keyboardShouldPersistTaps="handled"
      >
        <PostCard
          post={post}
          detail={true}
          flat
          onToggleLike={handleToggleLike}
          onPressComment={openComments}
          onSubmitExercise={handleSubmitExercise}
          onEditPost={canOwnerEdit ? handleNavigateEdit : undefined}
          onDeletePost={handleDeletePost}
          onReportPost={handleReportPost}
        />

        <View style={postStyles.detailCommentsSection}>
          <View style={postStyles.detailCommentsHeader}>
            <Text style={postStyles.detailCommentsTitle}>Bình luận</Text>
            {visibleCommentCount > 0 ? (
              <Text style={postStyles.detailCommentsCount}>
                {visibleCommentCount} bình luận
              </Text>
            ) : null}
          </View>

          {isLoadingComments ? (
            <View style={postStyles.detailCommentSkeletons}>
              <SkeletonComment />
              <SkeletonComment />
            </View>
          ) : commentError ? (
            <View style={postStyles.detailCommentsState}>
              <Text style={postStyles.warningText}>{commentError}</Text>
            </View>
          ) : comments.length > 0 ? (
            <View style={postStyles.detailCommentList}>
              {comments.map((comment) => (
                <CommentComponent key={comment.id} comment={comment} />
              ))}
            </View>
          ) : (
            <Text style={postStyles.detailCommentsEmpty}>
              Chưa có bình luận nào.
            </Text>
          )}

          {hasMoreComments ? (
            <Pressable
              onPress={openComments}
              style={({ pressed }) => [
                postStyles.detailLoadMoreComments,
                pressed && postStyles.detailLoadMoreCommentsPressed,
              ]}
              accessibilityRole="button"
            >
              <Text style={postStyles.detailLoadMoreCommentsText}>
                Xem thêm bình luận
              </Text>
            </Pressable>
          ) : null}

          {post.canComment === false || isCommentBlocked ? (
            <Text style={postStyles.detailCommentsLocked}>
              Bài viết này hiện không thể bình luận.
            </Text>
          ) : (
            <CommentComposer
              inputRef={inlineCommentInputRef}
              value={commentText}
              onChangeText={(nextText) => {
                setCommentText(nextText);
                if (commentError) setCommentError("");
              }}
              onSubmit={handleSubmitInlineComment}
              isSubmitting={isSubmittingComment}
              containerStyle={postStyles.detailInlineComposer}
              inputContainerStyle={postStyles.detailInlineComposerInput}
            />
          )}
        </View>

        {statusText ? (
          <View style={postStyles.detailStatus}>
            <Text style={postStyles.warningText}>{statusText}</Text>
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
