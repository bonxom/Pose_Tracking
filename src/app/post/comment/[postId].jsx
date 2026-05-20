import AppInput from "@/components/common/AppInput";
import { ThumbUpIcon } from "@/components/icons/LikeButton";
import SendIcon from "@/components/icons/SendIcon";
import SmileIcon from "@/components/icons/SmileIcon";
import CommentReactionPicker from "@/components/post/CommentReactionPicker";
import SkeletonComment from "@/components/post/SkeletonComment";
import colors from "@/constants/colors";
import sizes from "@/constants/sizes";
import { addComment, getComments } from "@/repositories/commentRepository";
import { getPostById } from "@/repositories/postRepository";
import commentOverlayStyles from "@/styles/post/comment-overlay.styles";
import postStyles from "@/styles/post.styles";
import { getInitials } from "@/utils/formatters";
import { redirectIfSessionExpired } from "@/utils/screenErrors";
import { getAuthSession } from "@/utils/session";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
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
const COMMENT_INPUT_MIN_HEIGHT = 48;
const COMMENT_INPUT_MAX_HEIGHT = 132;
const COMMENT_INPUT_VERTICAL_PADDING = 0;
const COMPOSER_ICON_COLOR = colors.subtext;

export default function CommentScreen() {
  const { postId } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const inputRef = useRef(null);
  const translateY = useRef(new Animated.Value(INITIAL_TRANSLATE_Y)).current;
  const [comments, setComments] = useState([]);
  const [post, setPost] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [commentInputHeight, setCommentInputHeight] = useState(
    COMMENT_INPUT_MIN_HEIGHT,
  );
  const [isReactionPickerVisible, setIsReactionPickerVisible] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    getAuthSession().then(setCurrentUser).catch(console.warn);
  }, []);

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
    setIsReactionPickerVisible(false);
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

  const COUNT = 20;

  const loadComments = useCallback(async () => {
    try {
      setIsLoading(true);
      const loadedPost = await getPostById(postId);
      setPost(loadedPost);
      const result = await getComments(loadedPost || postId, {
        index: 0,
        count: COUNT,
      });
      const loadedComments = result.comments || [];
      setComments(loadedComments);
      setHasMore(loadedComments.length === COUNT);
    } catch (error) {
      console.warn("Failed to load comments:", error);
      await redirectIfSessionExpired(error, router);
    } finally {
      setIsLoading(false);
    }
  }, [postId]);

  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMore) return;
    try {
      setIsLoadingMore(true);
      const result = await getComments(post || postId, {
        index: comments.length,
        count: COUNT,
      });
      const newComments = result.comments || [];
      setComments((prev) => [...newComments, ...prev]);
      setHasMore(newComments.length === COUNT);
    } catch (error) {
      console.warn("Failed to load more comments:", error);
    } finally {
      setIsLoadingMore(false);
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
      const nextHeight = Math.max(
        0,
        (event?.endCoordinates?.height || 0) - insets.bottom,
      );
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
  }, [insets.bottom]);

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
    const sanitizedComment = commentText
      .trim()
      .replace(/[\u0000-\u001F\u007F]/g, "");

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
        setComments((prevComments) => [result.comment, ...prevComments]);
        setCommentText("");
        setCommentInputHeight(COMMENT_INPUT_MIN_HEIGHT);
        setIsReactionPickerVisible(false);
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

  const handleToggleReactionPicker = () => {
    setIsReactionPickerVisible((current) => !current);
  };

  const handleSelectReaction = (reaction) => {
    setCommentText((current) =>
      current.trim().length ? `${current} ${reaction}` : reaction,
    );
    setIsReactionPickerVisible(false);
    inputRef.current?.focus();
  };

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
            paddingBottom: Math.max(insets.bottom, sizes.md) + keyboardHeight,
            transform: [{ translateY }],
          },
        ]}
      >
        <View {...panResponder.panHandlers} style={styles.dragZone}>
          <View style={styles.sheetHandle} />
          <View style={styles.headerMetaRow}>
            <View style={styles.likeSummary}>
              <Text style={styles.likeSummaryCount}>
                {Number(post?.likeCount) || 0}
              </Text>
              <View style={styles.likeIconBadge}>
                <View style={styles.likeIconScale}>
                  <ThumbUpIcon size={14} color={colors.white} filled />
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.content}>
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
              renderItem={({ item }) => (
                <View style={postStyles.commentCard}>
                  {item.isScoreComment ? (
                    <View
                      style={[
                        postStyles.scoreCommentCard,
                        styles.scoreCommentCard,
                      ]}
                    >
                      <Text style={postStyles.commentAuthor}>
                        {item.authorName}
                      </Text>
                      {item.score ? (
                        <Text style={styles.scoreCommentText}>
                          Điểm: {item.score}/100
                        </Text>
                      ) : null}
                    </View>
                  ) : null}
                  <Text style={postStyles.commentAuthor}>
                    {item.authorName}
                  </Text>
                  <Text style={postStyles.commentText}>{item.content}</Text>
                  <Text style={postStyles.commentMeta}>
                    {new Date(item.createdAt).toLocaleDateString("vi-VN")}
                  </Text>
                </View>
              )}
              style={styles.commentList}
              contentContainerStyle={styles.commentListContent}
              keyboardShouldPersistTaps="handled"
              ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
              ListEmptyComponent={
                <Text style={postStyles.subtitle}>Chưa có bình luận nào</Text>
              }
              ListHeaderComponent={
                hasMore ? (
                  <Pressable
                    style={styles.loadMoreButton}
                    onPress={handleLoadMore}
                  >
                    {isLoadingMore ? (
                      <ActivityIndicator size="small" color={colors.text} />
                    ) : (
                      <Text style={styles.loadMoreText}>
                        Xem các bình luận trước...
                      </Text>
                    )}
                  </Pressable>
                ) : null
              }
            />
          )}

          <View style={styles.composer}>
            {post?.canComment === false ? (
              <Text style={postStyles.subtitle}>
                Bài viết này đang tắt bình luận.
              </Text>
            ) : (
              <>
                {isReactionPickerVisible ? (
                  <CommentReactionPicker
                    onSelectReaction={handleSelectReaction}
                  />
                ) : null}
                <View style={styles.composerRow}>
                  <View style={styles.composerAvatar}>
                    <Text style={styles.composerAvatarText}>
                      {getInitials(
                        currentUser?.username ||
                          currentUser?.identifier ||
                          "Tôi",
                      )}
                    </Text>
                  </View>
                  <AppInput
                    ref={inputRef}
                    autoFocus
                    placeholder="Viết bình luận..."
                    value={commentText}
                    onChangeText={setCommentText}
                    onFocus={() => setIsReactionPickerVisible(false)}
                    multiline
                    numberOfLines={1}
                    scrollEnabled={
                      commentInputHeight >= COMMENT_INPUT_MAX_HEIGHT
                    }
                    onContentSizeChange={(event) => {
                      const nextHeight = Math.min(
                        COMMENT_INPUT_MAX_HEIGHT,
                        Math.max(
                          COMMENT_INPUT_MIN_HEIGHT,
                          (event.nativeEvent.contentSize?.height || 0) +
                            COMMENT_INPUT_VERTICAL_PADDING,
                        ),
                      );
                      setCommentInputHeight(nextHeight);
                    }}
                    containerStyle={styles.commentInputWrap}
                    style={[
                      styles.commentInput,
                      { height: commentInputHeight },
                    ]}
                  />
                  <Pressable
                    onPress={handleToggleReactionPicker}
                    style={({ pressed }) => [
                      styles.iconButton,
                      isReactionPickerVisible && styles.iconButtonActive,
                      pressed && styles.iconButtonPressed,
                    ]}
                    hitSlop={8}
                  >
                    <SmileIcon />
                  </Pressable>
                  <Pressable
                    onPress={handleSubmitComment}
                    disabled={isSubmitting || !commentText.trim()}
                    style={({ pressed }) => [
                      styles.sendButton,
                      (isSubmitting || !commentText.trim()) &&
                        styles.sendButtonDisabled,
                      pressed &&
                        !(isSubmitting || !commentText.trim()) &&
                        styles.sendButtonPressed,
                    ]}
                    hitSlop={8}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator
                        size="small"
                        color={COMPOSER_ICON_COLOR}
                      />
                    ) : (
                      <View style={styles.sendIconRotate}>
                        <SendIcon size={18} color={COMPOSER_ICON_COLOR} />
                      </View>
                    )}
                  </Pressable>
                </View>
                <Text style={postStyles.slotHint}>
                  {commentText.length}/500 ký tự
                </Text>
              </>
            )}
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = commentOverlayStyles;
