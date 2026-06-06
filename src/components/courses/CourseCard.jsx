import VideoTile from "@/components/post/VideoTile";
import colors from "@/constants/colors";
import { resolveAvatarUri } from "@/utils/profile";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View
} from "react-native";

// ─── Join Button ────────────────────────────────────────────────────────────
function joinButtonProps(item) {
  if (item.is_enrolled === "1") {
    return { title: "Đã tham gia", disabled: true };
  }
  if (item.is_requested === "1") {
    return { title: "Đã yêu cầu", disabled: true };
  }
  return { title: "Tham gia", disabled: false };
}

// ─── CourseCard ──────────────────────────────────────────────────────────────
export default function CourseCard({ item, onJoin, flat = false }) {
  const { title: btnTitle, disabled: btnDisabled } = joinButtonProps(item);
  const avatarUri = resolveAvatarUri(
    item.avatar || "",
    item.avatarVersion || item.profileSyncRequestedAt || "",
  );

  // Build video list from left_video / right_video (skip empty strings)
  const videos = [
    item.left_video ? { uri: item.left_video, thumb: item.left_video_thumb, angle: "Góc quay trái" } : null,
    item.right_video ? { uri: item.right_video, thumb: item.right_video_thumb, angle: "Góc quay phải" } : null,
  ].filter(Boolean);

  return (
    <View style={[localStyles.card, flat && localStyles.flatCard]}>
      {/* ── Creator header ── */}
      <View style={localStyles.headerRow}>
        <Image
          source={{ uri: avatarUri }}
          style={localStyles.avatarImage}
        />

        <View style={{ flex: 1, marginLeft: 10, gap: 2 }}>
          <Text style={localStyles.username} numberOfLines={1}>
            {item.username || "Giảng viên"}
          </Text>
        </View>

        <View style={localStyles.roleBadge}>
          <Text style={localStyles.roleBadgeText}>GV</Text>
        </View>
      </View>

      {/* ── Description ── */}
      {item.description ? (
        <Text style={localStyles.description}>{item.description}</Text>
      ) : null}

      {/* ── Videos ── */}
      {videos.length > 0 ? (
        <View style={[localStyles.videoGrid, flat && localStyles.videoGridFullBleed]}>
          {videos.slice(0, 2).map((video, index) => (
            <VideoTile
              key={video.uri || `${video.uri}_${index}`}
              video={video}
              index={index}
            />
          ))}
        </View>
      ) : null}

      {/* ── Action bar ── */}
      <View style={localStyles.actionRow}>
        <Pressable
          onPress={btnDisabled ? undefined : () => onJoin?.(item)}
          disabled={btnDisabled}
          style={({ pressed }) => [
            localStyles.joinButton,
            pressed && !btnDisabled && localStyles.joinButtonPressed,
            btnDisabled && localStyles.joinButtonDisabled,
          ]}
        >
          <Text
            style={[
              localStyles.joinButtonText,
              btnDisabled && localStyles.joinButtonTextDisabled,
            ]}
          >
            {btnTitle}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const localStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: "hidden",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  flatCard: {
    borderRadius: 0,
    borderWidth: 0,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },

  // Creator header
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  avatarImage: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.gray,
  },
  avatarFallback: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarFallbackText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.subtext,
  },
  username: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  roleBadge: {
    backgroundColor: colors.primaryLight,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginLeft: 8,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
  },

  // Description
  description: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    marginBottom: 12,
  },

  // Video grid
  videoGrid: {
    flexDirection: "row",
    gap: 0,
    marginBottom: 12,
    marginHorizontal: -16,
  },
  videoGridFullBleed: {
    marginHorizontal: -16,
  },

  // Action bar
  actionRow: {
    paddingTop: 4,
  },
  joinButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  joinButtonPressed: {
    backgroundColor: colors.primaryPressed,
  },
  joinButtonDisabled: {
    backgroundColor: colors.disabled,
  },
  joinButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "700",
  },
  joinButtonTextDisabled: {
    color: colors.white,
  },
});
