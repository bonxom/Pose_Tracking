import AppButton from "@/components/common/AppButton";
import LikeButton from "@/components/post/LikeButton";
import colors from "@/constants/colors";
import postStyles from "@/styles/post.styles";
import {
    formatRelativeTime,
    getInitials,
    isFreshPost,
} from "@/utils/formatters";
import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";

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
  detail = false,
}) {
  const [isExpanded, setIsExpanded] = useState(detail);

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
  const isSubmissionPost = post.type === "submission";
  const hashtags = useMemo(() => {
    const values = new Set(post.hashtags || []);
    if (post.courseId) values.add(`#${post.courseId}`);
    if (post.exerciseId) values.add(`#${post.exerciseId}`);
    return Array.from(values);
  }, [post.courseId, post.exerciseId, post.hashtags]);

  return (
    <View style={postStyles.card}>
      <View style={postStyles.headerRow}>
        <View style={postStyles.avatar}>
          <Text style={postStyles.avatarText}>
            {getInitials(post.author?.name || "Người dùng")}
          </Text>
        </View>

        <View style={{ flex: 1, gap: 4 }}>
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

        <View style={postStyles.roleBadge}>
          <Text style={postStyles.roleBadgeText}>
            {post.author?.role || "HV"}
          </Text>
        </View>
      </View>

      {post.exerciseTitle ? (
        <View style={postStyles.exerciseBanner}>
          <Text style={postStyles.exerciseBannerTitle}>
            {isExercisePost ? "Bài tập GV" : "Bài nộp HV"}
          </Text>
          <Text style={postStyles.exerciseBannerText}>{post.exerciseTitle}</Text>
          {post.courseTitle ? (
            <Text style={postStyles.exerciseBannerMeta}>{post.courseTitle}</Text>
          ) : null}
        </View>
      ) : null}

      <Text style={postStyles.bodyText}>{previewText}</Text>

      {shouldShowExpand ? (
        <Pressable onPress={() => setIsExpanded((current) => !current)}>
          <Text style={postStyles.expandText}>
            {isExpanded ? "Thu gọn" : "Xem thêm"}
          </Text>
        </Pressable>
      ) : null}

      {hashtags.length ? (
        <View style={postStyles.hashtagRow}>
          {hashtags.map((tag) => (
            <Text key={tag} style={postStyles.hashtagText}>
              {tag}
            </Text>
          ))}
        </View>
      ) : null}

      {post.videos?.length ? (
        <View style={postStyles.mediaList}>
          {post.videos.map((video, index) => (
            <View
              key={video.id || `${video.uri}_${index}`}
              style={postStyles.mediaCard}
            >
              <Text style={postStyles.mediaTitle}>
                {video.angle || `Video ${index + 1}`}
              </Text>
              <Text style={postStyles.mediaSubtitle}>{video.name}</Text>
              <Text
                style={[postStyles.mediaSubtitle, { color: colors.placeholder }]}
              >
                {video.uri}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

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

      <View style={postStyles.statsRow}>
        <Text style={postStyles.statText}>{formatCount(post.likeCount)} lượt thích</Text>
        <Text style={postStyles.statText}>{formatCount(post.commentCount)} bình luận</Text>
      </View>

      {post.canComment === false ? (
        <Text style={postStyles.lockedText}>Bài viết này đang khóa bình luận.</Text>
      ) : null}

      <View style={postStyles.actionRow}>
        <LikeButton
          isLiked={post.isLiked}
          likeCount={post.likeCount}
          onPress={onToggleLike}
        />

        <AppButton
          title="Bình luận"
          onPress={onPressComment}
          disabled={post.canComment === false}
          style={[postStyles.actionButton, postStyles.secondaryButton]}
          textStyle={postStyles.secondaryButtonText}
        />

        {isExercisePost ? (
          <AppButton
            title="Nộp bài"
            onPress={onSubmitExercise}
            style={postStyles.actionButton}
          />
        ) : null}

        {!detail ? (
          <AppButton
            title="Xem chi tiết"
            onPress={onPress}
            style={[postStyles.actionButton, postStyles.secondaryButton]}
            textStyle={postStyles.secondaryButtonText}
          />
        ) : null}
      </View>
    </View>
  );
}
