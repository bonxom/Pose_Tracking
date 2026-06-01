import colors from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { VideoView, useVideoPlayer } from "expo-video";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

// ─── Video Tile (inline, Option B – will be refactored later) ──────────────
function CourseVideoTile({ uri, label }) {
  const [isReady, setIsReady] = useState(false);
  const [isFullscreenVisible, setIsFullscreenVisible] = useState(false);
  const [videoSource, setVideoSource] = useState(uri);

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
    setVideoSource(uri);
    setIsReady(false);
  }, [uri]);

  useEffect(() => {
    previewPlayer.pause();
    fullscreenPlayer.pause();
  }, [videoSource, previewPlayer, fullscreenPlayer]);

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
          <Text style={localStyles.videoLabelText}>{label}</Text>
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
  const [isPressed, setIsPressed] = useState(false);

  // Build video list from left_video / right_video (skip empty strings)
  const videos = [
    item.left_video ? { uri: item.left_video, label: "Trái" } : null,
    item.right_video ? { uri: item.right_video, label: "Phải" } : null,
  ].filter(Boolean);

  return (
    <View style={[localStyles.card, flat && localStyles.flatCard]}>
      {/* ── Creator header ── */}
      <View style={localStyles.headerRow}>
        {item.avatar ? (
          <Image
            source={{ uri: item.avatar }}
            style={localStyles.avatarImage}
          />
        ) : (
          <View style={localStyles.avatarFallback}>
            <Text style={localStyles.avatarFallbackText}>
              {(item.username || "GV").slice(0, 2).toUpperCase()}
            </Text>
          </View>
        )}

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
      {/* {videos.length > 0 ? (
        <View style={[localStyles.videoGrid, flat && localStyles.videoGridFullBleed]}>
          {videos.map((v) => (
            <CourseVideoTile key={v.uri} uri={v.uri} label={v.label} />
          ))}
        </View>
      ) : null} */}

      {/* ── Action bar ── */}
      <View style={localStyles.actionRow}>
        <Pressable
          onPress={btnDisabled ? undefined : () => onJoin?.(item)}
          onPressIn={() => setIsPressed(true)}
          onPressOut={() => setIsPressed(false)}
          disabled={btnDisabled}
          style={[
            localStyles.joinButton,
            isPressed && !btnDisabled && localStyles.joinButtonPressed,
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
