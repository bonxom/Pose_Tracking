import AppButton from "@/components/common/AppButton";
import LikeButton from "@/components/icons/LikeButton";
import CommentButton from "@/components/post/CommentButton";
import PostOptionsSheet from "@/components/post/PostOptionsSheet";
import colors from "@/constants/colors";
import postStyles from "@/styles/post.styles";
import {
  formatRelativeTime,
  getInitials,
  isFreshPost,
} from "@/utils/formatters";
import { getAuthSession } from "@/utils/session";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { VideoView, useVideoPlayer } from "expo-video";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

const EXPAND_THRESHOLD = 180;
const VIDEO_FALLBACK_SOURCES = [
  require("../../../assets/cam1.mp4"),
  require("../../../assets/cam2.mp4"),
];

function formatCount(value = 0) {
  const count = Number(value) || 0;
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return String(count);
}

function PostVideoTile({ video, index, fallbackSource }) {
  const [isReady, setIsReady] = useState(false);
  const [isFullscreenVisible, setIsFullscreenVisible] = useState(false);
  const rawVideoUri = typeof video?.uri === "string" ? video.uri.trim() : "";
  const [videoSource, setVideoSource] = useState(rawVideoUri || fallbackSource);

  const previewPlayer = useVideoPlayer(videoSource, (player) => {
    player.loop = true;
    player.muted = true;
    player.pause();
  });

  const fullscreenPlayer = useVideoPlayer(videoSource, (player) => {
    player.loop = true;
    player.muted = false;
    player.pause();
  });

  useEffect(() => {
    setVideoSource(rawVideoUri || fallbackSource);
    setIsReady(false);
  }, [rawVideoUri, fallbackSource]);

  useEffect(() => {
    previewPlayer.pause();
    fullscreenPlayer.pause();
  }, [videoSource, previewPlayer, fullscreenPlayer]);

  useEffect(() => {
    const applyFallback = () => {
      setVideoSource((current) =>
        current === fallbackSource ? current : fallbackSource,
      );
    };

    const handleStatusChange = ({ status }) => {
      if (status === "error") {
        applyFallback();
      }
    };

    const previewSub = previewPlayer.addListener(
      "statusChange",
      handleStatusChange,
    );
    const fullscreenSub = fullscreenPlayer.addListener(
      "statusChange",
      handleStatusChange,
    );

    return () => {
      previewSub.remove();
      fullscreenSub.remove();
    };
  }, [fallbackSource, fullscreenPlayer, previewPlayer]);

  const openFullscreen = () => {
    setIsFullscreenVisible(true);
    fullscreenPlayer.pause();
  };

  const closeFullscreen = () => {
    setIsFullscreenVisible(false);
    fullscreenPlayer.pause();
  };

  if (!videoSource) return null;

  return (
    <>
      <Pressable style={localStyles.videoCard} onPress={openFullscreen}>
        <VideoView
          player={previewPlayer}
          style={localStyles.videoPreview}
          contentFit="cover"
          nativeControls={false}
          onFirstFrameRender={() => setIsReady(true)}
        />

        {!isReady ? (
          <View style={localStyles.videoLoadingOverlay}>
            <ActivityIndicator size="small" color={colors.white} />
          </View>
        ) : null}

        <View style={localStyles.videoLabel}>
          <Text style={localStyles.videoLabelText}>
            {video.angle || `Video ${index + 1}`}
          </Text>
        </View>
      </Pressable>

      <Modal
        visible={isFullscreenVisible}
        transparent
        animationType="fade"
        onRequestClose={closeFullscreen}
      >
        <View style={localStyles.fullscreenBackdrop}>
          <Pressable
            style={localStyles.closeButton}
            onPress={closeFullscreen}
            hitSlop={8}
          >
            <Ionicons name="close" size={28} color={colors.white} />
          </Pressable>

          <VideoView
            player={fullscreenPlayer}
            style={localStyles.fullscreenVideo}
            contentFit="contain"
            nativeControls
          />
        </View>
      </Modal>
    </>
  );
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
  const isExercisePost = post.type === "exercise" || post.canSubmit;
  const canSubmitExercise = isExercisePost && currentRole === "HV";
  const isSubmissionPost = post.type === "submission";
  const authorId = String(
    post?.author?.id ||
      post?.author?.handle ||
      post?.author?.name ||
      "",
  ).trim();
  const isOwnAuthorProfile = Boolean(
    authorId && currentUser?.id && String(currentUser.id) === authorId,
  );
  const hashtags = useMemo(() => {
    const values = new Set(post.hashtags || []);
    if (post.courseId) values.add(`#${post.courseId}`);
    if (post.exerciseId) values.add(`#${post.exerciseId}`);
    return Array.from(values);
  }, [post.courseId, post.exerciseId, post.hashtags]);

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

  const ContentContainer = onPress ? Pressable : View;

  return (
    <View style={[postStyles.card, flat && localStyles.flatCard]}>
      <View style={postStyles.headerRow}>
        <Pressable
          style={localStyles.authorPressable}
          onPress={handleOpenAuthorProfile}
          disabled={!authorId}
        >
          {post.author?.avatar ? (
            <Image source={{ uri: post.author.avatar }} style={postStyles.avatar} />
          ) : (
            <View style={postStyles.avatar}>
              <Text style={postStyles.avatarText}>
                {getInitials(post.author?.name || "Người dùng")}
              </Text>
            </View>
          )}

          <View style={localStyles.authorMeta}>
            <Text style={postStyles.authorName}>
              {post.author?.name || "Người dùng"}
            </Text>
            <Text
              style={[
                postStyles.metaText,
                metaIsFresh && postStyles.freshMetaText,
              ]}
            >
              {post.author?.handle || "@nguoidung"} ·{" "}
              {formatRelativeTime(post.createdAt)}
            </Text>
          </View>
        </Pressable>

        <View style={postStyles.roleBadge}>
          <Text style={postStyles.roleBadgeText}>
            {post.author?.role || "HV"}
          </Text>
        </View>

        <Pressable
          style={{ padding: 4, marginLeft: 4 }}
          onPress={() => setIsOptionsVisible(true)}
          hitSlop={8}
        >
          <Ionicons
            name="ellipsis-horizontal"
            size={20}
            color={colors.subtext}
          />
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
              <Text style={[postStyles.expandText, { color: colors.subtext }]}>
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
            <Text key={tag} style={postStyles.hashtagText}>
              {tag}
            </Text>
          ))}
        </View>
      ) : null}

      {/*post.videos?.length ? (
        <View
          style={[
            localStyles.videoGrid,
            flat && localStyles.videoGridFullBleed,
          ]}
        >
          {post.videos.slice(0, 2).map((video, index) => (
            <PostVideoTile
              key={video.id || `${video.uri}_${index}`}
              video={video}
              index={index}
              fallbackSource={
                VIDEO_FALLBACK_SOURCES[index] ||
                VIDEO_FALLBACK_SOURCES[VIDEO_FALLBACK_SOURCES.length - 1]
              }
            />
          ))}
        </View>
      ) : null*/}

      {post.timeSeriesPoses ? (
        <View style={postStyles.exerciseBanner}>
          <Text style={postStyles.exerciseBannerTitle}>time_series_poses</Text>
          <Text style={postStyles.exerciseBannerMeta}>
            Backend có dữ liệu tư thế theo thời gian cho bài này.
          </Text>
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

      <View style={postStyles.statsRow}>
        <Text style={postStyles.statText}>
          {formatCount(post.likeCount)} lượt thích
        </Text>
        <Text style={postStyles.statText}>
          {formatCount(post.commentCount)} bình luận
        </Text>
      </View>

      {post.canComment === false ? (
        <Text style={postStyles.lockedText}>
          Bài viết này đang khóa bình luận.
        </Text>
      ) : null}

      <View style={postStyles.actionRow}>
        <LikeButton
          isLiked={post.is_liked}
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
        onDeletePost={() => {
          setIsOptionsVisible(false);
          onDeletePost?.();
        }}
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
    </View>
  );
}

const localStyles = StyleSheet.create({
  authorPressable: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  authorMeta: {
    flex: 1,
    gap: 4,
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
  videoCard: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: colors.black,
    overflow: "hidden",
    position: "relative",
  },
  videoPreview: {
    width: "100%",
    height: "100%",
  },
  videoLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.overlayBlack40,
  },
  videoLabel: {
    position: "absolute",
    left: 8,
    bottom: 8,
    backgroundColor: colors.overlayBlack65,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  videoLabelText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "700",
  },
  fullscreenBackdrop: {
    flex: 1,
    backgroundColor: colors.black,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButton: {
    position: "absolute",
    top: 42,
    right: 16,
    zIndex: 2,
    padding: 6,
  },
  fullscreenVideo: {
    width: "100%",
    height: "100%",
  },
});
