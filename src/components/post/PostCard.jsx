import AppButton from "@/components/common/AppButton";
import EarthIcon from "@/components/icons/EarthIcon";
import EllipsisHorizontalIcon from "@/components/icons/EllipsisHorizontalIcon";
import CommentButton from "@/components/post/CommentButton";
import LikeButton from "@/components/post/LikeButton";
import PostOptionsSheet from "@/components/post/PostOptionsSheet";
import VideoTile from "@/components/post/VideoTile";
import colors from "@/constants/colors";
import postStyles from "@/styles/post.styles";
import { formatRelativeTime, isFreshPost } from "@/utils/formatters";
import { resolveAvatarUri } from "@/utils/profile";
import { getAuthSession } from "@/utils/session";
import { router } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import ThumbUpWithCircleIcon from "../icons/ThumbUpWithCircleIcon";

const EXPAND_THRESHOLD = 180;

function formatCount(value = 0) {
  const count = Number(value) || 0;
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return String(count);
}

export default function PostCard({
  post,
  onPress,
  onToggleLike,
  onPressComment,
  onSubmitExercise,
  onEditPost,
  onDeletePost,
  onReportPost,
  detail = false,
  flat = false,
}) {
  const [isExpanded, setIsExpanded] = useState(detail);
  const [currentUser, setCurrentUser] = useState(null);
  const [isOptionsVisible, setIsOptionsVisible] = useState(false);
  const [isDeleteAnimating, setIsDeleteAnimating] = useState(false);
  const removeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    getAuthSession().then(setCurrentUser).catch(console.warn);
  }, []);

  const isOwnPost = Boolean(
    currentUser?.id && post?.author?.id && currentUser.id === post.author.id,
  );
  const currentRole = String(
    currentUser?.role || currentUser?.user?.role || "",
  ).toUpperCase();

  const content = post.content || "Bài viết chưa có mô tả.";
  const shouldShowExpand = !detail && content.length > EXPAND_THRESHOLD;
  const previewText = useMemo(() => {
    if (detail || isExpanded || content.length <= EXPAND_THRESHOLD) {
      return content;
    }

    return `${content.slice(0, EXPAND_THRESHOLD).trimEnd()}...`;
  }, [content, detail, isExpanded]);

  const metaIsFresh = isFreshPost(post.createdAt, post.author?.online);
  const isExercisePost = post.author.role === "GV" || post.canSubmit;
  const canSubmitExercise = isExercisePost && currentRole === "HV";
  const isSubmissionPost = post.type === "submission";
  const authorId = String(
    post?.author?.id || post?.author?.handle || post?.author?.name || "",
  ).trim();
  const isOwnAuthorProfile = Boolean(
    authorId && currentUser?.id && String(currentUser.id) === authorId,
  );
  const likeCount = Number(post?.likeCount) || 0;
  const commentCount = Number(post?.commentCount) || 0;
  const likeSummaryText = post?.isLiked
    ? likeCount <= 1
      ? "Bạn đã thích"
      : `Bạn và ${likeCount - 1} người khác`
    : likeCount > 0
      ? formatCount(likeCount)
      : "";
  const hashtags = useMemo(() => {
    const values = new Set(post.hashtags || []);
    if (post.courseId) values.add(`#${post.courseId}`);
    if (post.exerciseId) values.add(`#${post.exerciseId}`);
    return Array.from(values);
  }, [post.courseId, post.exerciseId, post.hashtags]);
  const avatarUri = resolveAvatarUri(post.author?.avatar || "");
  const cardScale = removeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.98, 1],
  });

  const handleDeleteSuccess = () => {
    if (isDeleteAnimating) return;
    setIsOptionsVisible(false);
    setIsDeleteAnimating(true);

    Animated.timing(removeAnim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      onDeletePost?.(post?.id);
    });
  };

  const handleOpenAuthorProfile = () => {
    if (!authorId) return;

    if (isOwnAuthorProfile) {
      router.push("/(tabs)/profile");
      return;
    }

    router.push({
      pathname: "/profile/[userId]",
      params: { userId: authorId },
    });
  };

  const handlePressHashtag = (tag) => {
    const normalizedTag = String(tag || "").trim();
    if (!normalizedTag) return;

    router.push({
      pathname: "/search",
      params: {
        keyword: normalizedTag,
        autoSearch: "1",
        tab: "posts",
      },
    });
  };

  const handleOpenPostDetail = () => {
    onPress?.();
  };

  const ContentContainer = onPress ? Pressable : View;

  return (
    <Animated.View
      style={[
        postStyles.card,
        flat && localStyles.flatCard,
        {
          opacity: removeAnim,
          transform: [{ scale: cardScale }],
        },
      ]}
      pointerEvents={isDeleteAnimating ? "none" : "auto"}
    >
      <View style={postStyles.headerRow}>
        <Pressable
          onPress={handleOpenPostDetail}
          disabled={!onPress}
          style={localStyles.authorPressable}
        >
          <Pressable
            onPress={handleOpenAuthorProfile}
            disabled={!authorId}
            hitSlop={8}
            style={localStyles.avatarPressable}
          >
            <Image source={{ uri: avatarUri }} style={postStyles.avatar} />
          </Pressable>

          <View style={postStyles.authorMetaGroup}>
            <Pressable
              onPress={handleOpenAuthorProfile}
              disabled={!authorId}
              hitSlop={8}
              style={localStyles.authorNamePressable}
            >
              <Text style={postStyles.authorName}>
                {post.author?.name || "Người dùng"}
              </Text>
            </Pressable>

            <Pressable
              onPress={handleOpenPostDetail}
              disabled={!onPress}
              hitSlop={8}
              style={localStyles.metaPressable}
            >
              <Text
                style={[
                  postStyles.metaText,
                  metaIsFresh && postStyles.freshMetaText,
                ]}
              >
                {post.author?.handle || "@nguoidung"} {" - "}
                {formatRelativeTime(post.createdAt)} {" - "} <EarthIcon />
              </Text>
            </Pressable>
          </View>
        </Pressable>

        <Pressable
          onPress={handleOpenPostDetail}
          disabled={!onPress}
          hitSlop={8}
          style={postStyles.roleBadge}
        >
          <Text style={postStyles.roleBadgeText}>
            {post.author?.role || "HV"}
          </Text>
        </Pressable>

        <Pressable
          style={{ padding: 4, marginLeft: 4 }}
          onPress={() => setIsOptionsVisible(true)}
          hitSlop={8}
        >
          <EllipsisHorizontalIcon />
        </Pressable>
      </View>

      <ContentContainer onPress={onPress}>
        {post.exerciseTitle ? (
          <View style={postStyles.exerciseBanner}>
            <Text style={postStyles.exerciseBannerTitle}>
              {isExercisePost ? "Bài tập GV" : "Bài nộp HV"}
            </Text>
            <Text style={postStyles.exerciseBannerText}>
              {post.exerciseTitle}
            </Text>
            {post.courseTitle ? (
              <Text style={postStyles.exerciseBannerMeta}>
                {post.courseTitle}
              </Text>
            ) : null}
          </View>
        ) : null}

        {shouldShowExpand ? (
          <Pressable onPress={() => setIsExpanded((current) => !current)}>
            <Text style={postStyles.bodyText}>
              {isExpanded ? content : previewText}
              {!isExpanded && (
                <Text
                  style={[postStyles.expandText, { color: colors.subtext }]}
                >
                  Xem thêm
                </Text>
              )}
            </Text>
          </Pressable>
        ) : (
          <Text style={postStyles.bodyText}>{content}</Text>
        )}

        {hashtags.length ? (
          <View style={postStyles.hashtagRow}>
            {hashtags.map((tag) => (
              <Pressable
                key={tag}
                onPress={(event) => {
                  event.stopPropagation?.();
                  handlePressHashtag(tag);
                }}
              >
                <Text style={postStyles.hashtagText}>{tag}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {post.videos?.length ? (
          <View
            style={[
              localStyles.videoGrid,
              flat && localStyles.videoGridFullBleed,
            ]}
          >
            {post.videos.slice(0, 2).map((video, index) => (
              <VideoTile
                key={video.id || `${video.uri}_${index}`}
                video={video}
                index={index}
              />
            ))}
          </View>
        ) : null}

        {isSubmissionPost && post.scoreSummary ? (
          <View style={postStyles.scoreSummaryCard}>
            <Text style={postStyles.scoreSummaryNumber}>
              {post.scoreSummary.score}/100
            </Text>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={postStyles.scoreSummaryTitle}>
                {post.scoreSummary.label || "Đã chấm tự động"}
              </Text>
              <Text style={postStyles.scoreSummaryText}>
                {post.scoreSummary.mistakes?.slice(0, 2).join("; ")}
              </Text>
            </View>
          </View>
        ) : null}
      </ContentContainer>

      <Pressable
        onPress={handleOpenPostDetail}
        disabled={!onPress}
        style={postStyles.statsRow}
      >
        {likeCount > 0 && (
          <View style={localStyles.likeSummaryInline}>
            <ThumbUpWithCircleIcon />
            <Text style={postStyles.statText}>{likeSummaryText}</Text>
          </View>
        )}
        {commentCount > 0 && (
          <Text style={[postStyles.statText, postStyles.statTextRight]}>
            {formatCount(commentCount)} bình luận
          </Text>
        )}
      </Pressable>

      {post.canComment === false ? (
        <Pressable onPress={handleOpenPostDetail} disabled={!onPress}>
          <Text style={postStyles.lockedText}>
            Bài viết này đang khóa bình luận.
          </Text>
        </Pressable>
      ) : null}

      <View style={postStyles.actionRow}>
        <LikeButton
          isLiked={post.isLiked}
          onPress={onToggleLike}
          style={{ flex: 1, justifyContent: "center" }}
        />

        <CommentButton
          onPress={onPressComment}
          disabled={post.canComment === false}
          style={{ flex: 1, justifyContent: "center" }}
        />

        {canSubmitExercise && (
          <View style={{ flex: 1 }}>
            <AppButton
              title="Nộp bài"
              onPress={onSubmitExercise}
              style={[
                postStyles.actionButton,
                { minWidth: "auto", width: "100%" },
              ]}
            />
          </View>
        )}
      </View>

      <PostOptionsSheet
        visible={isOptionsVisible}
        onClose={() => setIsOptionsVisible(false)}
        isOwnPost={isOwnPost}
        postId={post?.id}
        onTurnOffNotifications={() => setIsOptionsVisible(false)}
        onTurnOnNotifications={() => setIsOptionsVisible(false)}
        onDeletePost={handleDeleteSuccess}
        onEditPost={
          onEditPost
            ? () => {
                setIsOptionsVisible(false);
                onEditPost();
              }
            : undefined
        }
        onReportPost={() => {
          setIsOptionsVisible(false);
          onReportPost?.();
        }}
      />
    </Animated.View>
  );
}

const localStyles = StyleSheet.create({
  authorPressable: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarPressable: {
    alignSelf: "flex-start",
  },
  authorNamePressable: {
    alignSelf: "flex-start",
    minWidth: 120,
    maxWidth: "100%",
  },
  metaPressable: {
    alignSelf: "flex-start",
    maxWidth: "100%",
  },
  flatCard: {
    borderRadius: 0,
    borderWidth: 0,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  videoGrid: {
    flexDirection: "row",
    gap: 0,
  },
  videoGridFullBleed: {
    marginHorizontal: -16,
  },
  likeSummaryInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
});
