import Screen from "@/components/common/Screen";
import DraftActionSheet from "@/components/post/DraftActionSheet";
import CircleWithCrossIcon from "@/components/icons/CircleWithCrossIcon";
import colors from "@/constants/colors";
import {
  editPost,
  getPostById,
} from "@/repositories/postRepository";
import { getUserInfo } from "@/repositories/userRepository";
import createStyles from "@/styles/post/create.styles";
import postStyles from "@/styles/post.styles";
import { redirectIfSessionExpired } from "@/utils/screenErrors";
import { getAuthSession } from "@/utils/session";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { VideoView, useVideoPlayer } from "expo-video";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

const VIDEO_FALLBACK_SOURCES = [
  require("../../../assets/cam1.mp4"),
  require("../../../assets/cam2.mp4"),
];

function VideoThumbnail({ video, fallbackSource, onPress }) {
  const [isReady, setIsReady] = useState(false);
  const rawVideoUri = typeof video?.uri === "string" ? video.uri.trim() : "";
  const [videoSource, setVideoSource] = useState(rawVideoUri || fallbackSource);
  const previewPlayer = useVideoPlayer(videoSource, (videoPlayer) => {
    videoPlayer.loop = true;
    videoPlayer.muted = true;
    videoPlayer.pause();
  });

  useEffect(() => {
    setVideoSource(rawVideoUri || fallbackSource);
    setIsReady(false);
  }, [rawVideoUri, fallbackSource]);

  useEffect(() => {
    previewPlayer.pause();
  }, [previewPlayer, videoSource]);

  useEffect(() => {
    const applyFallback = () => {
      setVideoSource((current) =>
        current === fallbackSource ? current : fallbackSource,
      );
    };

    const sub = previewPlayer.addListener("statusChange", ({ status }) => {
      if (status === "error") {
        applyFallback();
      }
    });

    return () => {
      sub.remove();
    };
  }, [fallbackSource, previewPlayer]);

  return (
    <Pressable style={createStyles.videoPreviewFrame} onPress={onPress}>
      <VideoView
        player={previewPlayer}
        style={createStyles.videoPreview}
        contentFit="cover"
        nativeControls={false}
        onFirstFrameRender={() => setIsReady(true)}
      />
      {!isReady ? (
        <View style={createStyles.videoLoadingOverlay}>
          <ActivityIndicator size="small" color={colors.white} />
        </View>
      ) : null}
      <View style={createStyles.videoPlayBadge}>
        <Text style={createStyles.videoPlayText}>Xem video</Text>
      </View>
    </Pressable>
  );
}

function FullscreenVideoModal({ visible, uri, onClose }) {
  const player = useVideoPlayer(uri || null, (videoPlayer) => {
    videoPlayer.loop = true;
    videoPlayer.muted = false;
    videoPlayer.pause();
  });

  useEffect(() => {
    player.pause();
  }, [player, uri]);

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
          <VideoView
            player={player}
            style={createStyles.fullscreenVideo}
            contentFit="contain"
            nativeControls
          />
        ) : null}
      </View>
    </Modal>
  );
}

export default function EditPostScreen() {
  const params = useLocalSearchParams();
  const postId = String(params.id || "");

  const [post, setPost] = useState(null);
  const [content, setContent] = useState("");
  const [initialContent, setInitialContent] = useState("");
  const [replacementVideos, setReplacementVideos] = useState([]);
  const [isReplacingVideos, setIsReplacingVideos] = useState(false);
  const [session, setSession] = useState(null);
  const [profileUser, setProfileUser] = useState(null);
  const [statusText, setStatusText] = useState("");
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const [textAreaHeight, setTextAreaHeight] = useState(26);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showDraftSheet, setShowDraftSheet] = useState(false);
  const [activeVideoUri, setActiveVideoUri] = useState("");

  const existingVideos = useMemo(() => post?.videos || [], [post?.videos]);
  const displayedVideos = isReplacingVideos ? replacementVideos : existingVideos;
  const selectedVideoCount = displayedVideos.filter(Boolean).length;
  const replacementVideoCount = replacementVideos.filter(Boolean).length;

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (!postId) {
        setStatusText("Không tìm thấy bài viết để chỉnh sửa.");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const authSession = await getAuthSession();
        if (isMounted) {
          setSession(authSession);
        }

        const user = await getUserInfo();
        if (isMounted) {
          setProfileUser(user);
        }

        const loadedPost = await getPostById(postId);
        if (!loadedPost) {
          throw new Error("Bài viết không tồn tại.");
        }

        const initialText = loadedPost.content || loadedPost.described || "";

        if (isMounted) {
          setPost(loadedPost);
          setContent(initialText);
          setInitialContent(initialText);
          setStatusText("");
        }
      } catch (error) {
        if (await redirectIfSessionExpired(error, router)) return;
        console.warn("Failed to load edit post data:", error);
        if (isMounted) {
          setStatusText(error.message || "Không thể tải dữ liệu bài viết.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, [postId]);

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, (event) => {
      setKeyboardOffset(event.endCoordinates?.height || 0);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardOffset(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const readVideoDuration = async (asset) => {
    if (asset.duration) return asset.duration;
    if (typeof document === "undefined" || !asset.uri) return 0;

    return new Promise((resolve) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => resolve(Math.round(video.duration * 1000));
      video.onerror = () => resolve(0);
      video.src = asset.uri;
    });
  };

  const buildVideoItem = async (asset, slotIndex) => {
    const duration = await readVideoDuration(asset);
    return {
      id: `edit_video_${slotIndex}_${Date.now()}`,
      uri: asset.uri,
      file: asset.file,
      name: asset.fileName || `edit-video-${slotIndex + 1}.mp4`,
      mimeType: asset.mimeType || "video/mp4",
      angle: slotIndex === 0 ? "Góc quay trái" : "Góc quay phải",
      duration,
      fileSize: asset.fileSize || 0,
    };
  };

  const pickVideo = async () => {
    if (!isReplacingVideos) {
      setIsReplacingVideos(true);
      setReplacementVideos([]);
    }

    if (replacementVideoCount >= 2) {
      Alert.alert("Giới hạn video", "Bạn chỉ có thể chọn tối đa 2 video.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: false,
      quality: 1,
    });

    if (result.canceled || !result.assets?.[0]) {
      return;
    }

    const video = await buildVideoItem(result.assets[0], replacementVideoCount);
    setReplacementVideos((current) => [...current, video].slice(0, 2));
  };

  const removeSelectedVideo = (index) => {
    setActiveVideoUri("");

    if (isReplacingVideos) {
      setReplacementVideos((current) =>
        current.filter((_, itemIndex) => itemIndex !== index),
      );
      return;
    }

    const seededVideos = existingVideos.slice(0, 2).filter(Boolean);
    setIsReplacingVideos(true);
    setReplacementVideos(
      seededVideos.filter((_, itemIndex) => itemIndex !== index),
    );
  };

  const handleSaveEdit = async () => {
    if (!post) return;

    const trimmedContent = content.trim();
    if (!trimmedContent) {
      setStatusText("Nội dung bài viết không được để trống.");
      return;
    }

    if (isReplacingVideos && replacementVideoCount !== 2) {
      Alert.alert("Thiếu video", "Nếu thay video, cần chọn đúng 2 video.");
      return;
    }

    try {
      setIsSubmitting(true);
      await editPost(post, {
        content: trimmedContent,
        videos: isReplacingVideos ? replacementVideos : undefined,
      });

      Alert.alert("Thành công", "Bài viết đã được cập nhật.");
      router.replace("/(tabs)/home");
    } catch (error) {
      if (await redirectIfSessionExpired(error, router)) return;
      console.warn("Failed to update post:", error);
      setStatusText(error.message || "Không thể cập nhật bài viết.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasContentChanged = content.trim() !== initialContent.trim();
  const hasDraftChanges = hasContentChanged || replacementVideoCount > 0;

  const handleBack = () => {
    if (hasDraftChanges) {
      setShowDraftSheet(true);
    } else {
      router.back();
    }
  };

  const handleSaveDraft = () => {
    setShowDraftSheet(false);
    Alert.alert("Đã lưu bản nháp", "Bản nháp chỉnh sửa đã được lưu cục bộ.");
    router.back();
  };

  const handleDiscard = () => {
    setShowDraftSheet(false);
    router.back();
  };

  const isSubmitDisabled =
    isSubmitting ||
    !content.trim() ||
    (isReplacingVideos && replacementVideoCount !== 2);

  const bottomToolbarInset = 56 + keyboardOffset;

  if (isLoading) {
    return (
      <Screen style={postStyles.screen}>
        <View style={createStyles.createBody}>
          <ActivityIndicator size="large" />
        </View>
      </Screen>
    );
  }

  if (!post) {
    return (
      <Screen style={postStyles.screen}>
        <View style={createStyles.createBody}>
          <Text style={postStyles.title}>Bài viết không tồn tại</Text>
          {statusText ? <Text style={postStyles.warningText}>{statusText}</Text> : null}
        </View>
      </Screen>
    );
  }

  return (
    <Screen style={postStyles.screen}>
      <View style={createStyles.header}>
        <Pressable onPress={handleBack} style={createStyles.backButton}>
          <Ionicons name="arrow-back-sharp" size={24} color={colors.text} />
        </Pressable>
        <Text style={createStyles.headerTitle}>Chỉnh sửa bài viết</Text>
        <Pressable
          onPress={handleSaveEdit}
          disabled={isSubmitDisabled}
          style={createStyles.submitButton}
        >
          <Text
            style={[
              createStyles.submitText,
              isSubmitDisabled && createStyles.submitTextDisabled,
            ]}
          >
            {isSubmitting ? "ĐANG XL..." : "LƯU"}
          </Text>
        </Pressable>
      </View>

      <View style={createStyles.createBody}>
        <ScrollView
          contentContainerStyle={[
            createStyles.createContent,
            { paddingBottom: bottomToolbarInset + 12 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={createStyles.userInfoContainer}>
            <Image
              source={{
                uri:
                  profileUser?.avatar ||
                  session?.avatar ||
                  session?.user?.avatar ||
                  "https://ui-avatars.com/api/?name=User&background=random",
              }}
              style={createStyles.avatar}
            />
            <View>
              <Text style={createStyles.userName}>
                {profileUser?.displayName ||
                  profileUser?.username ||
                  session?.displayName ||
                  session?.username ||
                  session?.user?.username ||
                  session?.user?.name ||
                  "Người dùng"}
              </Text>
              <View style={createStyles.privacyBadge}>
                <Ionicons name="earth" size={14} color={colors.subtext} />
                <Text style={createStyles.privacyText}>Công khai</Text>
              </View>
            </View>
          </View>

          {statusText ? <Text style={postStyles.warningText}>{statusText}</Text> : null}

          <TextInput
            placeholder="Viết nội dung bài viết của bạn..."
            placeholderTextColor={colors.placeholder}
            value={content}
            onChangeText={setContent}
            multiline
            style={[createStyles.createTextArea, { height: Math.max(26, textAreaHeight) }]}
            textAlignVertical="top"
            onContentSizeChange={(event) => {
              const nextHeight = event.nativeEvent.contentSize.height;
              if (!Number.isNaN(nextHeight)) {
                setTextAreaHeight(nextHeight);
              }
            }}
          />

          {selectedVideoCount > 0 ? (
            <View style={createStyles.videoGrid}>
              {displayedVideos.slice(0, 2).map((video, index) => {
                if (!video?.uri) return null;
                return (
                  <View key={video.id} style={createStyles.videoCard}>
                    <Pressable
                      style={createStyles.videoRemoveButton}
                      onPress={() => removeSelectedVideo(index)}
                      hitSlop={8}
                    >
                      <CircleWithCrossIcon />
                    </Pressable>
                    <VideoThumbnail
                      video={video}
                      fallbackSource={
                        VIDEO_FALLBACK_SOURCES[index] ||
                        VIDEO_FALLBACK_SOURCES[VIDEO_FALLBACK_SOURCES.length - 1]
                      }
                      onPress={() => setActiveVideoUri(video.uri)}
                    />
                  </View>
                );
              })}
            </View>
          ) : null}
        </ScrollView>

        <View style={[createStyles.bottomToolbar, { bottom: keyboardOffset }]}> 
          <Pressable onPress={pickVideo} style={createStyles.libraryButton} hitSlop={8}>
            <MaterialIcons name="photo-library" size={30} color={colors.subtext} />
            <Text style={createStyles.libraryText}>Video ({selectedVideoCount}/2)</Text>
          </Pressable>
        </View>
      </View>

      <DraftActionSheet
        visible={showDraftSheet}
        onClose={() => setShowDraftSheet(false)}
        onSaveDraft={handleSaveDraft}
        onDiscard={handleDiscard}
        onContinue={() => setShowDraftSheet(false)}
      />
      <FullscreenVideoModal
        visible={Boolean(activeVideoUri)}
        uri={activeVideoUri}
        onClose={() => setActiveVideoUri("")}
      />
    </Screen>
  );
}
