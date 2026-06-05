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

export default function VideoTile({ video, index }) {
  const [isFullscreenVisible, setIsFullscreenVisible] = useState(false);
  const [isFullscreenReady, setIsFullscreenReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  const rawVideoUri = video?.uri ? video.uri.trim() : "";
  const rawThumbUri = video?.thumb ? video.thumb : "";
  const [videoSource, setVideoSource] = useState(rawVideoUri);
  const fullscreenPlayer = useVideoPlayer(
    isFullscreenVisible ? videoSource : null,
    (player) => {
      player.loop = true;
      player.muted = false;
      player.pause();
    },
  );

  useEffect(() => {
    setVideoSource(rawVideoUri);
    setIsFullscreenReady(false);
    setHasError(false);
  }, [rawVideoUri]);

  useEffect(() => {
    fullscreenPlayer.pause();
  }, [videoSource, fullscreenPlayer]);

  useEffect(() => {
    const handleStatusChange = ({ status }) => {
      if (status === "error") {
        setIsFullscreenReady(true);
        setHasError(true);
      }
    };

    const fullscreenSub = fullscreenPlayer.addListener(
      "statusChange",
      handleStatusChange,
    );

    return () => {
      fullscreenSub.remove();
    };
  }, [fullscreenPlayer]);

  const handleRetry = () => {
    setHasError(false);
    setIsFullscreenReady(false);
    fullscreenPlayer.replace(videoSource);
    fullscreenPlayer.play();
  };

  const openFullscreen = () => {
    setIsFullscreenVisible(true);
    setIsFullscreenReady(false);
    setHasError(false);
    fullscreenPlayer.pause();
  };

  const closeFullscreen = () => {
    setIsFullscreenVisible(false);
    fullscreenPlayer.pause();
  };

  if (!videoSource) return null;

  return (
    <>
      <Pressable style={styles.videoCard} onPress={openFullscreen}>
        {rawThumbUri ? (
          <Image
            source={{ uri: rawThumbUri }}
            style={styles.videoPreview}
          />
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

      <Modal
        visible={isFullscreenVisible}
        transparent
        animationType="fade"
        onRequestClose={closeFullscreen}
      >
        <View style={styles.fullscreenBackdrop}>
          <Pressable
            style={styles.closeButton}
            onPress={closeFullscreen}
            hitSlop={8}
          >
            <CloseIcon />
          </Pressable>

          {isFullscreenVisible && videoSource ? (
            <>
              {hasError ? (
                <View style={styles.videoErrorOverlay}>
                  <Text style={styles.videoErrorText}>
                    Không thể tải video
                  </Text>
                  <AppButton
                    title="Thử lại"
                    onPress={handleRetry}
                    style={styles.retryButton}
                  />
                </View>
              ) : (
                <>
                  <VideoView
                    player={fullscreenPlayer}
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
            </>
          ) : null}
        </View>
      </Modal>
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
});
