import CloseIcon from "@/components/icons/CloseIcon";
import PlayVideoIcon from "@/components/icons/PlayVideoIcon";
import VideoCamOutlineIcon from "@/components/icons/VideoCamOutlineIcon";
import colors from "@/constants/colors";
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
import AppButton from "../common/AppButton";

function FullscreenVideoPlayer({ videoSource, visible, onClose }) {
  const [isFullscreenReady, setIsFullscreenReady] = useState(false);
  const [hasError, setHasError] = useState(false);

  const player = useVideoPlayer(videoSource, (playerInstance) => {
    playerInstance.loop = true;
    playerInstance.muted = false;
    playerInstance.play();
  });

  useEffect(() => {
    const handleStatusChange = ({ status }) => {
      if (status === "error") {
        setIsFullscreenReady(true);
        setHasError(true);
      }
    };

    const sub = player.addListener("statusChange", handleStatusChange);
    return () => {
      sub.remove();
    };
  }, [player]);

  const handleRetry = () => {
    setHasError(false);
    setIsFullscreenReady(false);
    player.replace(videoSource);
    player.play();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.fullscreenBackdrop}>
        <Pressable style={styles.closeButton} onPress={onClose} hitSlop={8}>
          <CloseIcon />
        </Pressable>

        {hasError ? (
          <View style={styles.videoErrorOverlay}>
            <Text style={styles.videoErrorText}>Không thể tải video</Text>
            <AppButton
              title="Thử lại"
              onPress={handleRetry}
              style={styles.retryButton}
            />
          </View>
        ) : (
          <>
            <VideoView
              player={player}
              style={styles.fullscreenVideo}
              contentFit="contain"
              nativeControls
              onFirstFrameRender={() => setIsFullscreenReady(true)}
            />
            {!isFullscreenReady ? (
              <View style={styles.videoLoadingOverlay}>
                <ActivityIndicator size="large" color={colors.white} />
              </View>
            ) : null}
          </>
        )}
      </View>
    </Modal>
  );
}

export default function VideoTile({ video, index }) {
  const [isFullscreenVisible, setIsFullscreenVisible] = useState(false);
  const rawVideoUri = video?.uri ? video.uri.trim() : "";
  const rawThumbUri = video?.thumb ? video.thumb : "";

  const openFullscreen = () => {
    setIsFullscreenVisible(true);
  };

  const closeFullscreen = () => {
    setIsFullscreenVisible(false);
  };

  if (!rawVideoUri) return null;

  return (
    <>
      <Pressable style={styles.videoCard} onPress={openFullscreen}>
        {rawThumbUri ? (
          <Image source={{ uri: rawThumbUri }} style={styles.videoPreview} />
        ) : (
          <View style={styles.videoPreviewFallback}>
            <VideoCamOutlineIcon />
            <Text style={styles.videoPreviewFallbackText}>
              Chưa có thumbnail
            </Text>
          </View>
        )}
        {rawThumbUri ? (
          <View pointerEvents="none" style={styles.playIconOverlay}>
            <PlayVideoIcon size={42} />
          </View>
        ) : null}

        <View style={styles.videoLabel}>
          <Text style={styles.videoLabelText}>
            {video.angle || `Video ${index + 1}`}
          </Text>
        </View>
      </Pressable>

      {isFullscreenVisible && (
        <FullscreenVideoPlayer
          key={rawVideoUri}
          videoSource={rawVideoUri}
          visible={isFullscreenVisible}
          onClose={closeFullscreen}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
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
  videoPreviewFallback: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.overlayBlack65,
    gap: 8,
  },
  videoPreviewFallbackText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "600",
  },
  playIconOverlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  videoLoadingOverlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
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
  videoErrorOverlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.black,
    gap: 16,
  },
  videoErrorText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  retryButton: {
    minWidth: 120,
  },
});
