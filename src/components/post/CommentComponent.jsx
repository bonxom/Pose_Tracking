import colors from "@/constants/colors";
import sizes from "@/constants/sizes";
import postStyles from "@/styles/post.styles";
import { formatRelativeTime, getInitials } from "@/utils/formatters";
import { resolveAvatarUri } from "@/utils/profile";
import { Image, StyleSheet, Text, View } from "react-native";

export default function CommentComponent({ comment }) {
  const avatarUri = resolveAvatarUri(comment?.author?.avatar || "");

  return (
    <View style={styles.commentRow}>
      <View style={styles.avatar}>
        {avatarUri ? (
          <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
        ) : (
          <Text style={styles.avatarText}>
            {getInitials(comment.authorName || "U")}
          </Text>
        )}
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
