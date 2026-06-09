import colors from "@/constants/colors";
import sizes from "@/constants/sizes";
import { useAuthSession } from "@/hooks/useAuthSession";
import postStyles from "@/styles/post.styles";
import { formatRelativeTime } from "@/utils/formatters";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import UserAvatar from "../common/UserAvatar";

export default function CommentComponent({ comment }) {
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
          {comment.isScoreComment ? (
            <View
              style={[postStyles.scoreCommentCard, styles.scoreCommentCard]}
            >
              <Text style={postStyles.commentAuthor}>{comment.authorName}</Text>
              {comment.score ? (
                <Text style={styles.scoreCommentText}>
                  Điểm: {comment.score}/100
                </Text>
              ) : null}
            </View>
          ) : null}
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

const styles = StyleSheet.create({
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryLight,
    marginBottom: 6,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 999,
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
  scoreCommentCard: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  scoreCommentText: {
    fontWeight: "700",
    marginVertical: 4,
  },
});
