import { router, useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";

function BackIcon() {
  return (
    <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15.7 5.3a1 1 0 0 1 0 1.4L10.42 12l5.28 5.3a1 1 0 1 1-1.42 1.4l-6-6a1 1 0 0 1 0-1.4l6-6a1 1 0 0 1 1.42 0Z"
        fill="#1C1E21"
      />
    </Svg>
  );
}

function LikeIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9.2 20H6.5A2.5 2.5 0 0 1 4 17.5v-5A2.5 2.5 0 0 1 6.5 10h2.1l2.14-5.02A1.7 1.7 0 0 1 12.3 4c1.18 0 2.02 1.16 1.65 2.28L13.4 8h4.1A2.5 2.5 0 0 1 20 10.5c0 .25-.04.5-.11.74l-1.67 5.5A4.5 4.5 0 0 1 13.91 20H9.2Z"
        fill="#1877F2"
      />
    </Svg>
  );
}

function CommentIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 11.5C4 7.91 7.58 5 12 5s8 2.91 8 6.5S16.42 18 12 18c-.76 0-1.49-.09-2.18-.26L6.5 19.5c-.65.34-1.4-.31-1.14-1l1.05-2.82C4.9 14.56 4 13.09 4 11.5Z"
        fill="#65676B"
      />
    </Svg>
  );
}

function handleBack() {
  router.replace("/notifications");
}

export default function MockPostDetailScreen() {
  const { id, source, comment_id } = useLocalSearchParams();

  const isComment = source === "comment";
  const isLike = source === "like";

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.replace("/notifications")}
          hitSlop={30}
          style={styles.backButton}
        >
          <BackIcon />
        </Pressable>

        <Text style={styles.headerTitle}>Chi tiết bài viết</Text>

        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.authorRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>P</Text>
            </View>

            <View style={styles.authorInfo}>
              <Text style={styles.authorName}>Pose Tracking</Text>
              <Text style={styles.timeText}>Bài viết demo · Vừa xong</Text>
            </View>
          </View>

          <Text style={styles.description}>
            Đây là bài viết demo dùng để kiểm tra điều hướng từ Notification.
          </Text>

          <View style={styles.videoMock}>
            <Text style={styles.videoText}>POST ID: {id}</Text>
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.summaryLeft}>
              <View style={styles.likeCircle}>
                <LikeIcon />
              </View>
              <Text style={styles.summaryText}>
                {isLike ? "Nguyen Van B và 1 người khác" : "2 lượt thích"}
              </Text>
            </View>

            <Text style={styles.summaryText}>
              {isComment ? "1 bình luận" : "Bình luận"}
            </Text>
          </View>

          <View style={styles.actionRow}>
            <Pressable style={styles.actionButton}>
              <LikeIcon />
              <Text style={[styles.actionText, isLike && styles.actionTextActive]}>
                Thích
              </Text>
            </Pressable>

            <Pressable style={styles.actionButton}>
              <CommentIcon />
              <Text style={styles.actionText}>Bình luận</Text>
            </Pressable>
          </View>

          {isComment ? (
            <View style={styles.commentsSection}>
              <Text style={styles.sectionTitle}>Bình luận liên quan</Text>

              <View style={styles.commentRow}>
                <View style={styles.commentAvatar}>
                  <Text style={styles.commentAvatarText}>T</Text>
                </View>

                <View style={styles.commentBubble}>
                  <Text style={styles.commentAuthor}>Tran Thi C</Text>
                  <Text style={styles.commentText}>
                    Bài tập này làm rất tốt!
                  </Text>

                  {comment_id ? (
                    <Text style={styles.commentMeta}>Comment ID: {comment_id}</Text>
                  ) : null}
                </View>
              </View>
            </View>
          ) : null}
        </View>

        <Text style={styles.note}>
          Màn này chỉ là mock để demo luồng Notification. Khi có route bài viết
          thật, thay /mock-post/[id] bằng route post thật của project.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F0F2F5",
  },

  header: {
    height: 56,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E4E6EB",
    zIndex: 10,
    elevation: 3,
  },

  backButton: {
    width: 60,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
    elevation: 10,
  },

  buttonPressed: {
    backgroundColor: "#F0F2F5",
  },

  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "800",
    color: "#1C1E21",
  },

  headerRight: {
    width: 48,
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    padding: 12,
    paddingBottom: 24,
  },

  card: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
  },

  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E7F3FF",
  },

  avatarText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0866FF",
  },

  authorInfo: {
    flex: 1,
  },

  authorName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1C1E21",
  },

  timeText: {
    marginTop: 2,
    fontSize: 12,
    color: "#65676B",
  },

  description: {
    fontSize: 15,
    lineHeight: 21,
    color: "#1C1E21",
    marginBottom: 12,
  },

  videoMock: {
    height: 200,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DADDE1",
    marginBottom: 12,
  },

  videoText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#65676B",
  },

  summaryRow: {
    minHeight: 36,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#E4E6EB",
    paddingBottom: 8,
  },

  summaryLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  likeCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
  },

  summaryText: {
    fontSize: 13,
    color: "#65676B",
  },

  actionRow: {
    height: 44,
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E4E6EB",
  },

  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  actionText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#65676B",
  },

  actionTextActive: {
    color: "#1877F2",
  },

  commentsSection: {
    paddingTop: 12,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1C1E21",
    marginBottom: 10,
  },

  commentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  commentAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    backgroundColor: "#E7F3FF",
  },

  commentAvatarText: {
    fontWeight: "800",
    color: "#0866FF",
  },

  commentBubble: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "#F0F2F5",
  },

  commentAuthor: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1C1E21",
    marginBottom: 2,
  },

  commentText: {
    fontSize: 14,
    lineHeight: 19,
    color: "#1C1E21",
  },

  commentMeta: {
    marginTop: 6,
    fontSize: 11,
    color: "#65676B",
  },

  note: {
    marginTop: 12,
    fontSize: 12,
    lineHeight: 18,
    color: "#65676B",
  },
});
