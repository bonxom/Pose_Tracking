import Screen from "@/components/common/Screen";
import DraftActionSheet from "@/components/post/DraftActionSheet";
import CircleWithCrossIcon from "@/components/icons/CircleWithCrossIcon";
import colors from "@/constants/colors";
import { DEMO_COURSE, DEMO_EXERCISES } from "@/constants/demo";
import {
  createExerciseSubmission,
  createPost,
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
  const [activeVideoUri, setActiveVideoUri] = useState("");

  const selectedVideoCount = selectedVideos.filter(Boolean).length;
  const role = String(session?.role || session?.user?.role || "").toUpperCase();
  const isStudent = role === "HV";
  const isTeacher = role === "GV";

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
    if (!role) return;

    if (isStudent && !isSubmissionMode) {
      Alert.alert("Không được phép", "Tài khoản học viên chỉ được nộp bài.");
      router.replace("/(tabs)/home");
      return;
    }

    if (isTeacher && isSubmissionMode) {
      Alert.alert("Không được phép", "Tài khoản giảng viên chỉ được tạo bài viết.");
      router.replace("/(tabs)/home");
    }
  }, [isStudent, isSubmissionMode, isTeacher, role]);

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

  const removeSelectedVideo = (index) => {
    setSelectedVideos((current) => current.filter((_, itemIndex) => itemIndex !== index));
    setActiveVideoUri("");
  };

  const handleCreatePost = async () => {
    if (isStudent && !isSubmissionMode) {
      Alert.alert("Không được phép", "Tài khoản học viên chỉ được nộp bài.");
      return;
    }

    if (isTeacher && isSubmissionMode) {
      Alert.alert("Không được phép", "Tài khoản giảng viên chỉ được tạo bài viết.");
      return;
    }

    const completeVideos = selectedVideos.filter(Boolean);

    if (isSubmissionMode && completeVideos.length !== 2) {
      Alert.alert("Thiếu video", "Bài nộp cần đúng 2 video.");
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
        router.replace("/(tabs)/home");
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

  const isSubmitDisabled = isSubmitting || selectedVideoCount !== 2;
  const bottomToolbarInset = 56 + keyboardOffset;

  return (
    <Screen style={postStyles.screen}>
      <View style={createStyles.header}>
        <Pressable onPress={handleBack} style={createStyles.backButton}>
          <Ionicons name="arrow-back-sharp" size={24} color="black" />
        </Pressable>
        <Text style={createStyles.headerTitle}>
          {isSubmissionMode ? "Nộp bài tập" : "Tạo bài viết"}
        </Text>
        <Pressable
          onPress={handleCreatePost}
          disabled={isSubmitDisabled}
          style={createStyles.submitButton}
        >
          <Text
            style={[
              createStyles.submitText,
              isSubmitDisabled && createStyles.submitTextDisabled,
            ]}
          >
            {isSubmitting ? "ĐANG XL..." : isSubmissionMode ? "NỘP" : "ĐĂNG"}
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

          {isSubmissionMode ? (
            <Text style={createStyles.modeHint}>
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
              {selectedVideos.map((video, index) => {
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

        <View
          style={[
            createStyles.bottomToolbar,
            { bottom: keyboardOffset },
          ]}
        >
          <Pressable
            onPress={pickCreateVideo}
            style={createStyles.libraryButton}
            hitSlop={8}
          >
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
