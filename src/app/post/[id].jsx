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
import sizes from "@/constants/sizes";
import { addComment, getComments } from "@/repositories/commentRepository";
import {
  getPostById,
  PostUnavailableError,
  toggleLike,
} from "@/repositories/postRepository";
import postStyles from "@/styles/post.styles";
import { redirectIfSessionExpired } from "@/utils/screenErrors";
import { getAuthSession } from "@/utils/session";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const COMMENT_PREVIEW_COUNT = 3;

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const [post, setPost] = useState(null);
  const [session, setSession] = useState(null);
  const [statusText, setStatusText] = useState("");
  const [isUnavailable, setIsUnavailable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [comments, setComments] = useState([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [commentError, setCommentError] = useState("");
  const [hasMoreComments, setHasMoreComments] = useState(false);
  const [isCommentBlocked, setIsCommentBlocked] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const inlineCommentInputRef = useRef(null);
  const scrollViewRef = useRef(null);
  const keyboardScrollTimeoutRef = useRef(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [composerHeight, setComposerHeight] = useState(0);

  const composerBottomInset = useMemo(
    () =>
      keyboardHeight > 0
        ? keyboardHeight + sizes.xs - sizes.md
        : Math.max(insets.bottom - sizes.md, 0),
    [insets.bottom, keyboardHeight],
  );

  const detailScrollBottomPadding = useMemo(
    () => composerHeight,
    [composerHeight],
  );

  const handleGoBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/(tabs)/home");
  }, []);

  const handleGoHome = useCallback(() => {
    router.replace("/(tabs)/home");
  }, []);

  const loadPost = useCallback(async () => {
    try {
      setIsLoading(true);
      setStatusText("");
      setIsUnavailable(false);
      setCommentError("");
      const currentSession = await getAuthSession();
      setSession(currentSession);
      const data = await getPostById(id);
      setPost(data);
    } catch (error) {
      console.warn("Failed to load post:", error);
      if (await redirectIfSessionExpired(error, router)) return;
      if (error instanceof PostUnavailableError || error?.postUnavailable) {
        setPost(null);
        setIsUnavailable(true);
        return;
      }
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

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const handleShow = (event) => {
      setKeyboardHeight(
        Math.max(0, event?.endCoordinates?.height + insets.bottom || 0),
      );
    };

    const handleHide = () => {
      setKeyboardHeight(0);
    };

    const showSubscription = Keyboard.addListener(showEvent, handleShow);
    const hideSubscription = Keyboard.addListener(hideEvent, handleHide);

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const scrollInlineComposerIntoView = useCallback((animated = true) => {
    if (keyboardScrollTimeoutRef.current) {
      clearTimeout(keyboardScrollTimeoutRef.current);
    }

    keyboardScrollTimeoutRef.current = setTimeout(
      () => {
        requestAnimationFrame(() => {
          scrollViewRef.current?.scrollToEnd({ animated });
        });
      },
      Platform.OS === "web" ? 0 : 48,
    );
  }, []);

  useEffect(() => {
    if (keyboardHeight <= 0) {
      if (keyboardScrollTimeoutRef.current) {
        clearTimeout(keyboardScrollTimeoutRef.current);
        keyboardScrollTimeoutRef.current = null;
      }
      return;
    }

    // Wait for the padding update from keyboardHeight before scrolling.
    scrollInlineComposerIntoView(true);
  }, [keyboardHeight, scrollInlineComposerIntoView]);

  useEffect(() => {
    return () => {
      if (keyboardScrollTimeoutRef.current) {
        clearTimeout(keyboardScrollTimeoutRef.current);
      }
    };
  }, []);

  const handleInlineCommentFocus = useCallback(() => {
    scrollInlineComposerIntoView(keyboardHeight > 0);
  }, [keyboardHeight, scrollInlineComposerIntoView]);

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
        courseId: post.teacherId || post.author?.id || post.courseId,
        exerciseId: post.id,
        teacherUsername: post.author?.name || post.author?.handle || "",
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
  const isInlineComposerDisabled =
    post?.canComment === false || isCommentBlocked;
  const visibleCommentCount = Math.max(
    Number(post?.commentCount) || 0,
    comments.length,
  );

  const handleDeletePost = () => {
    router.replace("/(tabs)/home");
  };

  const handleReportPost = () => {
    setStatusText(
      "Cảm ơn bạn đã gửi báo cáo. Chúng tôi sẽ xem xét bài viết này.",
    );
  };

  const handlePostUnavailable = () => {
    setPost(null);
    setIsUnavailable(true);
    setStatusText("");
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
    const stateTitle = isUnavailable
      ? "Bài viết không khả dụng"
      : "Không thể hiển thị bài viết";
    const stateText = isUnavailable
      ? "Nội dung này hiện không thể hiển thị. Bài viết có thể đã bị xóa, bị giới hạn quyền xem hoặc bạn không thể truy cập nội dung này."
      : "Bài viết không tồn tại hoặc bạn không có quyền xem nội dung này.";

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
          <View style={postStyles.detailUnavailableCard}>
            <View style={postStyles.detailUnavailableIcon}>
              <Ionicons
                name="document-lock-outline"
                size={30}
                color={colors.subtext}
              />
            </View>
            <Text style={postStyles.detailStateTitle}>{stateTitle}</Text>
            <Text style={postStyles.detailStateText}>{stateText}</Text>
          </View>
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
          {isUnavailable ? (
            <Pressable
              onPress={handleGoHome}
              style={({ pressed }) => [
                postStyles.detailStateButton,
                postStyles.detailStateButtonSecondary,
                pressed && postStyles.detailStateButtonPressed,
              ]}
              accessibilityRole="button"
            >
              <Text style={postStyles.detailStateButtonSecondaryText}>
                Quay lại bảng tin
              </Text>
            </Pressable>
          ) : null}
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
      <View style={postStyles.detailBody}>
        <ScrollView
          ref={scrollViewRef}
          style={postStyles.detailScrollView}
          contentContainerStyle={[
            postStyles.detailScrollContent,
            { paddingBottom: detailScrollBottomPadding },
          ]}
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
            onPostUnavailable={handlePostUnavailable}
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
          </View>

          {statusText ? (
            <View style={postStyles.detailStatus}>
              <Text style={postStyles.warningText}>{statusText}</Text>
            </View>
          ) : null}
        </ScrollView>

        <CommentComposer
          inputRef={inlineCommentInputRef}
          value={commentText}
          onChangeText={(nextText) => {
            setCommentText(nextText);
            if (commentError) setCommentError("");
          }}
          onSubmit={handleSubmitInlineComment}
          isSubmitting={isSubmittingComment}
          disabled={isInlineComposerDisabled}
          disabledText="Bài viết này hiện không thể bình luận."
          onFocus={handleInlineCommentFocus}
          onLayout={(event) => {
            const nextHeight = Math.ceil(event.nativeEvent.layout.height || 0);
            setComposerHeight((current) =>
              current === nextHeight ? current : nextHeight,
            );
          }}
          containerStyle={[
            postStyles.detailBottomComposerBar,
            { paddingBottom: composerBottomInset },
          ]}
        />
      </View>
    </Screen>
  );
}
