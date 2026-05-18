import Screen from "@/components/common/Screen";
import DraftActionSheet from "@/components/post/DraftActionSheet";
import colors from "@/constants/colors";
import { DEMO_COURSE, DEMO_EXERCISES } from "@/constants/demo";
import {
  createExerciseSubmission,
  createPost,
  getPostById,
} from "@/repositories/postRepository";
import { ACTIVE_SOURCES } from "@/repositories/source";
import { getUserInfo } from "@/repositories/userRepository";
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
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

function VideoPreview({ uri }) {
  const [isVideoReady, setIsVideoReady] = useState(false);

  const player = useVideoPlayer(uri, (videoPlayer) => {
    videoPlayer.loop = true;
    videoPlayer.muted = true;
    videoPlayer.pause();
  });

  useEffect(() => {
    setIsVideoReady(false);
  }, [uri]);

  return (
    <View style={localStyles.videoPreviewFrame}>
      <VideoView
        player={player}
        style={localStyles.videoPreview}
        contentFit="cover"
        nativeControls
        onFirstFrameRender={() => setIsVideoReady(true)}
      />
      {!isVideoReady ? (
        <View style={localStyles.videoLoadingOverlay}>
          <ActivityIndicator size="small" color={colors.white} />
        </View>
      ) : null}
    </View>
  );
}

export default function CreatePostScreen() {
  const params = useLocalSearchParams();
  const isSubmissionMode = params.mode === "submission";

  const [content, setContent] = useState("");
  const [sourcePost, setSourcePost] = useState(null);
  const [selectedVideos, setSelectedVideos] = useState([]);
  const [session, setSession] = useState(null);
  const [profileUser, setProfileUser] = useState(null);
  const [statusText, setStatusText] = useState("");
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const [textAreaHeight, setTextAreaHeight] = useState(26);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDraftSheet, setShowDraftSheet] = useState(false);

  const selectedVideoCount = selectedVideos.filter(Boolean).length;

  const exercise = useMemo(() => {
    return (
      DEMO_EXERCISES.find((item) => item.id === params.exerciseId) ||
      DEMO_EXERCISES[0]
    );
  }, [params.exerciseId]);

  useEffect(() => {
    let isMounted = true;

    const loadSourcePost = async () => {
      const authSession = await getAuthSession();
      if (isMounted) {
        setSession(authSession);
      }

      try {
        const user = await getUserInfo();
        if (isMounted) {
          setProfileUser(user);
        }
      } catch (error) {
        if (await redirectIfSessionExpired(error, router)) return;
        console.warn("Failed to load current user profile:", error);
      }

      if (!params.sourcePostId) return;
      const post = await getPostById(params.sourcePostId);
      if (isMounted) {
        setSourcePost(post);
      }
    };

    loadSourcePost();
    return () => {
      isMounted = false;
    };
  }, [params.sourcePostId]);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

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
      id: `real_video_${slotIndex}_${Date.now()}`,
      uri: asset.uri,
      file: asset.file,
      name: asset.fileName || `real-video-${slotIndex + 1}.mp4`,
      mimeType: asset.mimeType || "video/mp4",
      angle: slotIndex === 0 ? "Góc quay trái" : "Góc quay phải",
      duration,
      fileSize: asset.fileSize || 0,
    };
  };

  const pickCreateVideo = async () => {
    if (selectedVideoCount >= 2) {
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

    const video = await buildVideoItem(result.assets[0], selectedVideoCount);
    setSelectedVideos((current) => [...current, video].slice(0, 2));
  };

  const handleCreatePost = async () => {
    const completeVideos = selectedVideos.filter(Boolean);

    if (isSubmissionMode && completeVideos.length !== 2) {
      Alert.alert("Thiếu video", "Bài nộp cần đúng 2 video.");
      return;
    }

    if (!content.trim()) {
      Alert.alert(
        "Lỗi",
        isSubmissionMode ? "Vui lòng nhập ghi chú bài nộp" : "Vui lòng nhập nội dung bài viết",
      );
      return;
    }

    try {
      setIsSubmitting(true);
      const newPost = isSubmissionMode
        ? await createExerciseSubmission({
            content,
            videos: completeVideos,
            courseId: params.courseId || DEMO_COURSE.id,
            exerciseId: params.exerciseId || exercise.id,
            sourcePostId: params.sourcePostId || sourcePost?.id || "",
          })
        : await createPost({
            content: content.trim(),
            videos: completeVideos,
          });

      if (newPost) {
        const isLocalSession =
          session?.demoMode || session?.source === ACTIVE_SOURCES.LOCAL;

        Alert.alert(
          "Thành công",
          isSubmissionMode
            ? isLocalSession
              ? "Bài nộp local đã được chấm demo."
              : "Bài nộp đã được gửi lên server."
            : "Bài viết đã được tạo",
        );
        router.replace(`/post/${newPost.id}`);
      }
    } catch (error) {
      console.warn("Failed to create post:", error);
      if (await redirectIfSessionExpired(error, router)) return;
      setStatusText(
        error.message || "Không thể tạo bài viết. Vui lòng thử lại.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (content.trim() || selectedVideoCount > 0) {
      setShowDraftSheet(true);
    } else {
      router.back();
    }
  };

  const handleSaveDraft = () => {
    setShowDraftSheet(false);
    Alert.alert("Đã lưu bản nháp", "Bản nháp của bạn đã được lưu cục bộ.");
    router.back();
  };

  const handleDiscard = () => {
    setShowDraftSheet(false);
    router.back();
  };

  const isSubmitDisabled =
    isSubmitting || (isSubmissionMode && selectedVideoCount !== 2) || !content.trim();
  const bottomToolbarInset = 56 + keyboardOffset;

  return (
    <Screen style={postStyles.screen}>
      <View style={localStyles.header}>
        <Pressable onPress={handleBack} style={localStyles.backButton}>
          <Ionicons name="arrow-back-sharp" size={24} color="black" />
        </Pressable>
        <Text style={localStyles.headerTitle}>
          {isSubmissionMode ? "Nộp bài tập" : "Tạo bài viết"}
        </Text>
        <Pressable
          onPress={handleCreatePost}
          disabled={isSubmitDisabled}
          style={localStyles.submitButton}
        >
          <Text
            style={[
              localStyles.submitText,
              isSubmitDisabled && localStyles.submitTextDisabled,
            ]}
          >
            {isSubmitting ? "ĐANG XL..." : isSubmissionMode ? "NỘP" : "ĐĂNG"}
          </Text>
        </Pressable>
      </View>

      <View style={localStyles.createBody}>
        <ScrollView
          contentContainerStyle={[
            localStyles.createContent,
            { paddingBottom: bottomToolbarInset + 12 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={localStyles.userInfoContainer}>
            <Image
              source={{
                uri:
                  profileUser?.avatar ||
                  session?.avatar ||
                  session?.user?.avatar ||
                  "https://ui-avatars.com/api/?name=User&background=random",
              }}
              style={localStyles.avatar}
            />
            <View>
              <Text style={localStyles.userName}>
                {profileUser?.displayName ||
                  profileUser?.username ||
                  session?.displayName ||
                  session?.username ||
                  session?.user?.username ||
                  session?.user?.name ||
                  "Người dùng"}
              </Text>
              <View style={localStyles.privacyBadge}>
                <Ionicons name="earth" size={14} color={colors.subtext} />
                <Text style={localStyles.privacyText}>Công khai</Text>
              </View>
            </View>
          </View>

          {isSubmissionMode ? (
            <Text style={localStyles.modeHint}>
              Nộp 2 video thật, mỗi video tối thiểu 10 giây và thời lượng tương đương nhau.
            </Text>
          ) : null}

          {statusText ? <Text style={postStyles.warningText}>{statusText}</Text> : null}

          <TextInput
            placeholder={
              isSubmissionMode
                ? "Ví dụ: Em nộp bài với 2 góc quay theo hướng dẫn..."
                : "Viết nội dung bài viết của bạn..."
            }
            placeholderTextColor={colors.placeholder}
            value={content}
            onChangeText={setContent}
            multiline
            style={[localStyles.createTextArea, { height: Math.max(26, textAreaHeight) }]}
            textAlignVertical="top"
            onContentSizeChange={(event) => {
              const nextHeight = event.nativeEvent.contentSize.height;
              if (!Number.isNaN(nextHeight)) {
                setTextAreaHeight(nextHeight);
              }
            }}
          />

          {selectedVideoCount > 0 ? (
            <View style={localStyles.videoGrid}>
              {selectedVideos.map((video) => {
                if (!video?.uri) return null;
                return (
                  <View key={video.id} style={localStyles.videoCard}>
                    <VideoPreview uri={video.uri} />
                  </View>
                );
              })}
            </View>
          ) : null}
        </ScrollView>

        <View
          style={[
            localStyles.bottomToolbar,
            { bottom: keyboardOffset },
          ]}
        >
          <Pressable
            onPress={pickCreateVideo}
            style={localStyles.libraryButton}
            hitSlop={8}
          >
            <MaterialIcons name="photo-library" size={30} color={colors.subtext} />
            <Text style={localStyles.libraryText}>Video ({selectedVideoCount}/2)</Text>
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
    </Screen>
  );
}

const localStyles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
  },
  submitButton: {
    padding: 4,
  },
  submitText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2196F3",
  },
  submitTextDisabled: {
    color: colors.textMuted,
  },
  createBody: {
    flex: 1,
    position: "relative",
  },
  createContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    gap: 12,
  },
  userInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 0,
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
  },
  userName: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.text,
  },
  privacyBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "transparent",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
    marginTop: 4,
    alignSelf: "flex-start",
  },
  privacyText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.subtext,
  },
  modeHint: {
    fontSize: 13,
    color: colors.subtext,
    lineHeight: 18,
  },
  createTextArea: {
    minHeight: 26,
    fontSize: 18,
    color: colors.text,
    paddingHorizontal: 0,
    paddingVertical: 0,
    lineHeight: 26,
  },
  videoGrid: {
    flexDirection: "row",
    gap: 0,
  },
  videoCard: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  videoPreviewFrame: {
    position: "relative",
    width: "100%",
    aspectRatio: 1,
    backgroundColor: colors.black,
  },
  videoPreview: {
    width: "100%",
    height: "100%",
  },
  videoLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15, 23, 42, 0.35)",
  },
  bottomToolbar: {
    position: "absolute",
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.white,
  },
  libraryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
  },
  libraryText: {
    fontSize: 14,
    color: colors.subtext,
    fontWeight: "600",
  },
});
