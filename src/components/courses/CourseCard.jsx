import UserAvatar from "@/components/common/UserAvatar";
import VideoTile from "@/components/post/VideoTile";
import colors from "@/constants/colors";
import { useAuthSession } from "@/hooks/useAuthSession";
import { splitContentAndHashtags } from "@/utils/hashtags";
import { router } from "expo-router";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

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
  const { session: currentUser } = useAuthSession();

  const authorId = String(item.course_id || "").trim();
  const isOwnAuthorProfile = Boolean(
    authorId && currentUser?.id && String(currentUser.id) === authorId,
  );

  const { content, hashtags } = useMemo(() => {
    const rawContent = item.description || "";
    const rawHashtags = Array.isArray(item.hashtags) ? item.hashtags : [];
    const hashtagPayload = splitContentAndHashtags(rawContent, rawHashtags);
    return {
      content: hashtagPayload.content,
      hashtags: hashtagPayload.hashtags || [],
    };
  }, [item.description, item.hashtags]);

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
        requestId: String(Date.now()),
      },
    });
  };

  // Build video list from left_video / right_video (skip empty strings)
  const videos = [
    item.left_video
      ? {
          uri: item.left_video,
          thumb: item.left_video_thumb,
          angle: "Góc quay trái",
        }
      : null,
    item.right_video
      ? {
          uri: item.right_video,
          thumb: item.right_video_thumb,
          angle: "Góc quay phải",
        }
      : null,
  ].filter(Boolean);

  return (
    <Pressable
      style={[localStyles.card, flat && localStyles.flatCard]}
      onPress={handleOpenAuthorProfile}
    >
      {/* ── Creator header ── */}
      <View style={localStyles.headerRow}>
        <UserAvatar uri={item.avatar} />

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
      {content ? (
        <Text style={localStyles.description}>{content}</Text>
      ) : null}

      {/* ── Hashtags ── */}
      {hashtags.length > 0 ? (
        <View style={localStyles.hashtagRow}>
          {hashtags.map((tag) => (
            <Pressable
              key={tag}
              onPress={(event) => {
                event.stopPropagation?.();
                handlePressHashtag(tag);
              }}
            >
              <Text style={localStyles.hashtagText}>{tag}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {/* ── Videos ── */}
      {videos.length > 0 ? (
        <View
          style={[
            localStyles.videoGrid,
            flat && localStyles.videoGridFullBleed,
          ]}
        >
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
    </Pressable>
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
  hashtagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  hashtagText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: "700",
  },
});
