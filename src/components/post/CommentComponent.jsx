import colors from "@/constants/colors";
import sizes from "@/constants/sizes";
import { useAuthSession } from "@/hooks/useAuthSession";
import postStyles from "@/styles/post.styles";
import { formatRelativeTime } from "@/utils/formatters";
import { Ionicons } from "@expo/vector-icons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import UserAvatar from "../common/UserAvatar";

// ─── System comment: score result ────────────────────────────────────────────
function SystemScoreComment({ comment }) {
  return (
    <View style={styles.systemCard}>
      <View style={styles.systemAccentBar} />
      <View style={styles.systemCardInner}>
        <View style={styles.systemHeader}>
          <Ionicons
            name="checkmark-circle-sharp"
            size={16}
            color={colors.primary}
          />
          <Text style={styles.systemLabel}>{comment.authorName}</Text>
          <MaterialCommunityIcons name="pin" size={16} color={colors.primary} />
        </View>

        <View style={styles.scoreBlock}>
          <Text style={styles.scoreNumber}>
            {comment.score}
            <Text style={styles.scoreOutOf}>/100</Text>
          </Text>
          {Boolean(comment.detailMistakes) && (
            <Text style={styles.detailMistakesText}>
              {comment.detailMistakes}
            </Text>
          )}
        </View>

        <Text style={styles.systemMeta}>
          {formatRelativeTime(comment.createdAt)}
        </Text>
      </View>
    </View>
  );
}

// ─── System comment: error / pending ─────────────────────────────────────────
function SystemErrorComment({ comment }) {
  return (
    <View style={[styles.systemCard, styles.systemCardError]}>
      <View style={[styles.systemAccentBar, styles.systemAccentBarError]} />
      <View style={styles.systemCardInner}>
        <View style={styles.systemHeader}>
          <Ionicons name="alert-circle" size={16} color={colors.error} />
          <Text style={[styles.systemLabel, styles.systemLabelError]}>
            {comment.authorName}
          </Text>
          <MaterialCommunityIcons name="pin" size={16} color={colors.error} />
        </View>

        <Text style={styles.errorMessageText}>{comment.content}</Text>

        <Text style={[styles.systemMeta, styles.systemMetaError]}>
          {formatRelativeTime(comment.createdAt)}
        </Text>
      </View>
    </View>
  );
}

// ─── Normal user comment ──────────────────────────────────────────────────────
function NormalComment({ comment }) {
  const { session: currentUser } = useAuthSession();

  const avatarUri = useMemo(() => {
    const authorId = String(comment?.author?.id || "").trim();
    const isOwn = Boolean(
      currentUser?.id && authorId && currentUser.id === authorId,
    );
    if (isOwn) {
      return currentUser?.avatar || comment?.author?.avatar || "";
    }
    return comment?.author?.avatar || "";
  }, [
    comment?.author?.avatar,
    comment?.author?.id,
    currentUser?.avatar,
    currentUser?.profileSyncRequestedAt,
    currentUser?.id,
  ]);

  return (
    <View style={styles.commentRow}>
      <View style={styles.avatar}>
        <UserAvatar uri={avatarUri} size={36} />
      </View>

      <View style={styles.contentColumn}>
        <View style={postStyles.commentCard}>
          <Text style={postStyles.commentAuthor}>{comment.authorName}</Text>
          <Text style={postStyles.commentText}>{comment.content}</Text>
        </View>
        <Text style={[postStyles.commentMeta, styles.commentMeta]}>
          {"   "}
          {formatRelativeTime(comment.createdAt)}
        </Text>
      </View>
    </View>
  );
}

// ─── Entry point ─────────────────────────────────────────────────────────────
export default function CommentComponent({ comment }) {
  if (comment?.isSystemComment) {
    const hasScore = Boolean(comment.score) || Boolean(comment.detailMistakes);
    if (hasScore) {
      return <SystemScoreComment comment={comment} />;
    }
    return <SystemErrorComment comment={comment} />;
  }

  return <NormalComment comment={comment} />;
}

const styles = StyleSheet.create({
  // ── Normal comment ────────────────────────────────────────────
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryLight,
    marginBottom: 6,
  },
  commentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: sizes.sm,
  },
  contentColumn: {
    flex: 1,
    gap: sizes.xs,
  },
  commentMeta: {
    paddingLeft: 0,
  },

  // ── System card shared ────────────────────────────────────────
  systemCard: {
    flexDirection: "row",
    borderRadius: sizes.radiusMd,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    backgroundColor: "#EFF6FF", // blue-50
    overflow: "hidden",
  },
  systemCardError: {
    borderColor: "#FEE2E2", // red-100
    backgroundColor: "#FFF7F7",
  },
  systemAccentBar: {
    width: 4,
    backgroundColor: colors.primary,
    borderTopLeftRadius: sizes.radiusMd,
    borderBottomLeftRadius: sizes.radiusMd,
  },
  systemAccentBarError: {
    backgroundColor: colors.error,
  },
  systemCardInner: {
    flex: 1,
    paddingHorizontal: sizes.sm,
    paddingVertical: sizes.sm,
    gap: sizes.xs,
  },

  // ── System header row ─────────────────────────────────────────
  systemHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  systemLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
  },
  systemLabelError: {
    color: colors.error,
  },
  pinBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: colors.primaryLight,
  },
  pinBadgeError: {
    backgroundColor: "#FEE2E2",
  },
  pinBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.primary,
  },
  pinBadgeTextError: {
    color: colors.error,
  },

  // ── Score block ───────────────────────────────────────────────
  scoreBlock: {
    alignItems: "center",
    paddingVertical: sizes.sm,
    gap: sizes.xs,
  },
  scoreNumber: {
    fontSize: 40,
    fontWeight: "800",
    color: colors.primary,
    lineHeight: 48,
  },
  scoreOutOf: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.subtext,
  },
  detailMistakesText: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.subtext,
    textAlign: "center",
  },

  // ── Error message ─────────────────────────────────────────────
  errorMessageText: {
    fontSize: 13,
    lineHeight: 19,
    color: "#991B1B", // red-800
    fontStyle: "italic",
  },

  // ── System meta (time) ────────────────────────────────────────
  systemMeta: {
    fontSize: 11,
    color: colors.subtext,
  },
  systemMetaError: {
    color: "#B91C1C", // red-700, slightly lighter
    opacity: 0.75,
  },
});
