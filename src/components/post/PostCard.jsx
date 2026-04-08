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

export default function PostCard({
  post,
  onPress,
  onToggleLike,
  onPressComment,
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

      <Text style={postStyles.bodyText}>{previewText}</Text>

      {shouldShowExpand ? (
        <Pressable onPress={() => setIsExpanded((current) => !current)}>
          <Text style={postStyles.expandText}>
            {isExpanded ? "Thu gọn" : "Xem thêm"}
          </Text>
        </Pressable>
      ) : null}

      {post.videos?.length ? (
        <View style={postStyles.mediaList}>
          {post.videos.map((video, index) => (
            <View
              key={video.id || `${video.uri}_${index}`}
              style={postStyles.mediaCard}
            >
              <Text style={postStyles.mediaTitle}>Video {index + 1}</Text>
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

      <View style={postStyles.statsRow}>
        <Text style={postStyles.statText}>{post.likeCount} lượt thích</Text>
        <Text style={postStyles.statText}>{post.commentCount} bình luận</Text>
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
