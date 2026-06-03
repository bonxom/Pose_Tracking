import UploadIcon from "@/components/icons/UploadIcon";
import colors from "@/constants/colors";
import createStyles from "@/styles/post/create.styles";
import { Ionicons } from "@expo/vector-icons";
import { VideoView, useVideoPlayer } from "expo-video";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  Text,
  View,
} from "react-native";

export const VIDEO_SLOTS = [
  { key: "left_video", label: "Góc quay trái", emptyText: "Tải video trái" },
  { key: "right_video", label: "Góc quay phải", emptyText: "Tải video phải" },
];

export function normalizeVideoSlots(videos = []) {
  return [videos[0] || null, videos[1] || null];
}

export function PostVideoPreview({ video, label, onPress }) {
  const [isReady, setIsReady] = useState(false);
  const videoUri = typeof video?.uri === "string" ? video.uri.trim() : "";
  const player = useVideoPlayer(videoUri || null, (videoPlayer) => {
    videoPlayer.loop = false;
    videoPlayer.muted = true;
    videoPlayer.pause();
  });

  useEffect(() => {
    setIsReady(false);
    player.pause();
  }, [player, videoUri]);

  useEffect(() => {
    const sub = player.addListener("statusChange", ({ status }) => {
      if (status === "error") {
        setIsReady(true);
      }
    });

    return () => {
      sub.remove();
    };
  }, [player]);

  return (
    <Pressable style={createStyles.videoPreviewFrame} onPress={onPress}>
      {videoUri ? (
        <>
          <VideoView
            player={player}
            style={createStyles.videoPreview}
            contentFit="cover"
            nativeControls={false}
            allowsFullscreen={false}
            onFirstFrameRender={() => setIsReady(true)}
          />
          {!isReady ? (
            <View style={createStyles.videoLoadingOverlay}>
              <ActivityIndicator size="small" color={colors.white} />
            </View>
          ) : null}
        </>
      ) : (
        <View style={createStyles.videoPreviewFallback}>
          <Ionicons name="videocam-outline" size={24} color={colors.white} />
          <Text style={createStyles.videoPreviewFallbackText}>
            Chưa có video
          </Text>
        </View>
      )}
      <View style={createStyles.videoPlayBadge}>
        <Text style={createStyles.videoPlayText}>Xem video</Text>
      </View>
      <View style={createStyles.videoAngleBadge}>
        <Text style={createStyles.videoAngleText}>{label}</Text>
      </View>
    </Pressable>
  );
}

export function PostVideoUploadSlot({ label, emptyText, onPress }) {
  return (
    <Pressable style={createStyles.videoPreviewFrame} onPress={onPress}>
      <View style={createStyles.uploadFrame}>
        <UploadIcon />
        <Text style={createStyles.uploadFrameTitle}>{emptyText}</Text>
        <Text style={createStyles.uploadFrameSubtitle}>{label}</Text>
      </View>
    </Pressable>
  );
}

export function PostVideoFullscreenModal({ visible, uri, onClose }) {
  const [isReady, setIsReady] = useState(false);
  const player = useVideoPlayer(visible ? uri || null : null, (videoPlayer) => {
    videoPlayer.loop = true;
    videoPlayer.muted = false;
    videoPlayer.pause();
  });

  useEffect(() => {
    player.pause();
  }, [player, uri]);

  useEffect(() => {
    if (visible && uri) {
      setIsReady(false);
      return;
    }
    setIsReady(true);
  }, [visible, uri]);

  useEffect(() => {
    const sub = player.addListener("statusChange", ({ status }) => {
      if (status === "error") {
        setIsReady(true);
      }
    });

    return () => {
      sub.remove();
    };
  }, [player]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={createStyles.fullscreenBackdrop}>
        <Pressable
          style={createStyles.closeButton}
          onPress={onClose}
          hitSlop={8}
        >
          <Ionicons name="close" size={28} color={colors.white} />
        </Pressable>

        {uri ? (
          <>
            <VideoView
              player={player}
              style={createStyles.fullscreenVideo}
              contentFit="contain"
              nativeControls
              onFirstFrameRender={() => setIsReady(true)}
            />
            {!isReady ? (
              <View style={createStyles.videoLoadingOverlay}>
                <ActivityIndicator size="large" color={colors.white} />
              </View>
            ) : null}
          </>
        ) : null}
      </View>
    </Modal>
  );
}
