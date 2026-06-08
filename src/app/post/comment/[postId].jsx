import ThumbUpWithCircleIcon from "@/components/icons/ThumbUpWithCircleIcon";
import CommentComponent from "@/components/post/CommentComponent";
import CommentComposer from "@/components/post/CommentComposer";
import SkeletonComment from "@/components/post/SkeletonComment";
import {
  dedupeCommentsById,
  validateCommentText,
} from "@/components/post/commentThreadUtils";
import sizes from "@/constants/sizes";
import { addComment, getComments } from "@/repositories/commentRepository";
import { getPostById } from "@/repositories/postRepository";
import postStyles from "@/styles/post.styles";
import commentOverlayStyles from "@/styles/post/comment-overlay.styles";
import { redirectIfSessionExpired } from "@/utils/screenErrors";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  FlatList,
  Keyboard,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SHEET_OPEN_DELAY_MS = 80;
const SHEET_FOCUS_DELAY_MS = 280;
const DISMISS_DISTANCE = 110;
const DISMISS_VELOCITY = 1.1;
const INITIAL_TRANSLATE_Y = 640;
const DEFAULT_COMMENT_COUNT = 20;

export default function CommentScreen() {
  const { postId } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const inputRef = useRef(null);
  const translateY = useRef(new Animated.Value(INITIAL_TRANSLATE_Y)).current;
  const [comments, setComments] = useState([]);
  const [post, setPost] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [commentIndex, setCommentIndex] = useState(0);
  const [commentCount] = useState(DEFAULT_COMMENT_COUNT);
  const [isLoadingOlderComments, setIsLoadingOlderComments] = useState(false);
  const [hasMoreOlderComments, setHasMoreOlderComments] = useState(false);
  const [commentError, setCommentError] = useState("");
  const [isCommentBlocked, setIsCommentBlocked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const sheetBottomPadding = useMemo(
    () =>
      Math.max(insets.bottom, sizes.md) +
      (keyboardHeight > 0 ? keyboardHeight + sizes.xs : 0),
    [insets.bottom, keyboardHeight],
  );

  const backdropOpacity = useMemo(
    () =>
      translateY.interpolate({
        inputRange: [0, INITIAL_TRANSLATE_Y],
        outputRange: [1, 0],
        extrapolate: "clamp",
      }),
    [translateY],
  );

  const closeSheet = useCallback(() => {
    setKeyboardHeight(0);
    Keyboard.dismiss();
    Animated.timing(translateY, {
      toValue: INITIAL_TRANSLATE_Y,
      duration: 220,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        if (router.canGoBack()) {
          router.back();
          return;
        }

        if (postId) {
          router.replace(`/post/${postId}`);
          return;
        }

        router.replace("/(tabs)/home");
      }
    });
  }, [postId, translateY]);

  const loadComments = useCallback(async () => {
    try {
      setIsLoading(true);
      setCommentError("");
      setIsCommentBlocked(false);
      setCommentIndex(0);
      setHasMoreOlderComments(false);
      const loadedPost = await getPostById(postId);
      setPost(loadedPost);
      const result = await getComments(loadedPost || postId, {
        index: 0,
        count: commentCount,
      });
      const loadedComments = dedupeCommentsById(result.comments || []);
      const receivedCount = Number(
        result?.receivedCount ?? loadedComments.length,
      );
      const blocked = result?.isBlocked === true;
      setComments(loadedComments);
      setCommentIndex(0);
      setIsCommentBlocked(blocked);
      setHasMoreOlderComments(
        !blocked && (result?.hasOlder ?? receivedCount >= commentCount),
      );
    } catch (error) {
      console.warn("Failed to load comments:", error);
      await redirectIfSessionExpired(error, router);
    } finally {
      setIsLoading(false);
    }
  }, [commentCount, postId]);

  const handleLoadMore = async () => {
    if (isLoadingOlderComments || !hasMoreOlderComments || isCommentBlocked) {
      return;
    }

    try {
      setIsLoadingOlderComments(true);
      setCommentError("");
      const nextIndex = commentIndex + 1;
      const result = await getComments(post || postId, {
        index: nextIndex,
        count: commentCount,
      });
      const newComments = dedupeCommentsById(result.comments || []);
      const receivedCount = Number(result?.receivedCount ?? newComments.length);
      const blocked = result?.isBlocked === true;

      if (blocked) {
        setIsCommentBlocked(true);
      }

      if (newComments.length > 0) {
        setComments((prev) => dedupeCommentsById([...newComments, ...prev]));
      }

      setCommentIndex(nextIndex);
      setHasMoreOlderComments(
        !blocked &&
          newComments.length > 0 &&
          (result?.hasOlder ?? receivedCount >= commentCount),
      );
    } catch (error) {
      console.warn("Failed to load more comments:", error);
      setCommentError("Không thể tải thêm bình luận. Vui lòng thử lại.");
    } finally {
      setIsLoadingOlderComments(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  useEffect(() => {
    const openTimer = setTimeout(() => {
      Animated.timing(translateY, {
        toValue: 0,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }, SHEET_OPEN_DELAY_MS);

    const focusTimer = setTimeout(() => {
      inputRef.current?.focus();
    }, SHEET_FOCUS_DELAY_MS);

    return () => {
      clearTimeout(openTimer);
      clearTimeout(focusTimer);
    };
  }, [translateY]);

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const handleShow = (event) => {
      const nextHeight = Math.max(0, event?.endCoordinates?.height || 0);
      setKeyboardHeight(nextHeight);
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

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) =>
          gestureState.dy > 6 &&
          Math.abs(gestureState.dy) > Math.abs(gestureState.dx),
        onPanResponderMove: (_, gestureState) => {
          translateY.setValue(Math.max(0, gestureState.dy));
        },
        onPanResponderRelease: (_, gestureState) => {
          if (
            gestureState.dy > DISMISS_DISTANCE ||
            gestureState.vy > DISMISS_VELOCITY
          ) {
            closeSheet();
            return;
          }

          Animated.spring(translateY, {
            toValue: 0,
            damping: 20,
            mass: 0.8,
            stiffness: 180,
            useNativeDriver: true,
          }).start();
        },
        onPanResponderTerminate: () => {
          Animated.spring(translateY, {
            toValue: 0,
            damping: 20,
            mass: 0.8,
            stiffness: 180,
            useNativeDriver: true,
          }).start();
        },
      }),
    [closeSheet, translateY],
  );

  const handleSubmitComment = async () => {
    const { text: sanitizedComment, error } = validateCommentText(commentText);

    if (error) {
      Alert.alert("Lỗi", error);
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await addComment(post || postId, sanitizedComment);
      if (result.comment) {
        setComments((prevComments) =>
          dedupeCommentsById([result.comment, ...prevComments]),
        );
        setCommentText("");
        inputRef.current?.focus();
      }
    } catch (error) {
      console.warn("Failed to add comment:", error);
      if (await redirectIfSessionExpired(error, router)) return;
      Alert.alert("Lỗi", "Không thể đăng bình luận. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const likeCount = Number(post?.likeCount) || 0;
  const isCommentComposerDisabled =
    post?.canComment === false || isCommentBlocked;
  const likeSummaryText = post?.isLiked
    ? likeCount <= 1
      ? "Bạn đã thích"
      : `Bạn và ${likeCount - 1} người khác`
    : likeCount > 0
      ? String(likeCount)
      : "";

  return (
    <View style={styles.modalRoot}>
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={closeSheet} />
      </Animated.View>

      <Animated.View
        style={[
          styles.sheet,
          {
            paddingTop: Math.max(insets.top, sizes.md),
            paddingBottom: sheetBottomPadding,
            transform: [{ translateY }],
          },
        ]}
      >
        <View {...panResponder.panHandlers} style={styles.dragZone}>
          <View style={styles.sheetHandle} />
          <View style={styles.headerMetaRow}>
            {likeCount > 0 && (
              <View style={styles.likeSummary}>
                <ThumbUpWithCircleIcon />
                <Text style={postStyles.statText}>{likeSummaryText}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.commentListContainer}>
            {isLoading ? (
              <View style={styles.skeletonContainer}>
                <SkeletonComment />
                <SkeletonComment />
                <SkeletonComment />
                <SkeletonComment />
                <SkeletonComment />
              </View>
            ) : (
              <FlatList
                data={comments}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <CommentComponent comment={item} />}
                style={styles.commentList}
                contentContainerStyle={styles.commentListContent}
                keyboardShouldPersistTaps="handled"
                ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
                ListEmptyComponent={
                  <Text style={postStyles.subtitle}>Chưa có bình luận nào</Text>
                }
                ListHeaderComponent={
                  hasMoreOlderComments || commentError ? (
                    <View>
                      {hasMoreOlderComments ? (
                        <Pressable
                          style={styles.loadMoreButton}
                          onPress={handleLoadMore}
                          disabled={isLoadingOlderComments}
                        >
                          <Text style={styles.loadMoreText}>
                            {isLoadingOlderComments
                              ? "Đang tải..."
                              : "Xem các bình luận trước..."}
                          </Text>
                        </Pressable>
                      ) : null}
                      {commentError ? (
                        <Text style={styles.commentErrorText}>
                          {commentError}
                        </Text>
                      ) : null}
                    </View>
                  ) : null
                }
              />
            )}
          </View>

          <CommentComposer
            inputRef={inputRef}
            autoFocus
            value={commentText}
            onChangeText={setCommentText}
            onSubmit={handleSubmitComment}
            isSubmitting={isSubmitting}
            disabled={isCommentComposerDisabled}
            disabledText={
              isCommentBlocked
                ? "Bài viết này hiện không thể bình luận."
                : "Bài viết này đang tắt bình luận."
            }
          />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = commentOverlayStyles;
