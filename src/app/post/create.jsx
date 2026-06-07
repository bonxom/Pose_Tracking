import Screen from "@/components/common/Screen";
import DraftActionSheet from "@/components/post/DraftActionSheet";
import {
  PostVideoFullscreenModal,
  PostVideoPreview,
  PostVideoUploadSlot,
  VIDEO_SLOTS,
} from "@/components/post/PostVideoSlots";
import CircleWithCrossIcon from "@/components/icons/CircleWithCrossIcon";
import EarthIcon from "@/components/icons/EarthIcon";
import colors from "@/constants/colors";
import {
  createExerciseSubmission,
  createPost,
  getPostById,
  validateTwoVideos,
} from "@/repositories/postRepository";
import {
  enqueuePostUploading,
  rejectPostUploading,
  resolvePostUploading,
} from "@/services/postUploadingStore";
import { getUserInfo } from "@/repositories/userRepository";
import createStyles from "@/styles/post/create.styles";
import postStyles from "@/styles/post.styles";
import {
  CACHE_KEY_CREATEPOST_DRAFT,
  readCache,
  writeCache,
} from "@/utils/cacheStore";
import { redirectIfSessionExpired } from "@/utils/screenErrors";
import { getAuthSession } from "@/utils/session";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Image,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

function buildDraftMode(isSubmissionMode) {
  return isSubmissionMode ? "submission" : "post";
}

function serializeDraftVideos(videos = []) {
  return VIDEO_SLOTS.map((_, index) => {
    const video = videos[index];
    if (!video?.uri) return null;

    return {
      id: video.id || `draft_video_${index}`,
      uri: video.uri,
      name: video.name || video.fileName || `draft-video-${index + 1}.mp4`,
      mimeType: video.mimeType || video.type || "video/mp4",
      angle: video.angle || (index === 0 ? "Góc quay trái" : "Góc quay phải"),
      fieldName: video.fieldName || (index === 0 ? "left_video" : "right_video"),
      isLocalUpload: true,
      duration: Number(video.duration || 0),
      fileSize: Number(video.fileSize || 0),
    };
  });
}

function hydrateDraftVideos(videos = []) {
  return VIDEO_SLOTS.map((_, index) => {
    const video = videos[index];
    if (!video?.uri) return null;

    return {
      id: video.id || `draft_video_${index}`,
      uri: String(video.uri),
      name: video.name || video.fileName || `draft-video-${index + 1}.mp4`,
      mimeType: video.mimeType || video.type || "video/mp4",
      angle: video.angle || (index === 0 ? "Góc quay trái" : "Góc quay phải"),
      fieldName: video.fieldName || (index === 0 ? "left_video" : "right_video"),
      isLocalUpload: true,
      duration: Number(video.duration || 0),
      fileSize: Number(video.fileSize || 0),
    };
  });
}

function isMatchingDraftContext(draft, context) {
  if (!draft || typeof draft !== "object") return false;

  return (
    String(draft.mode || "") === context.mode &&
    String(draft.courseId || "") === context.courseId &&
    String(draft.exerciseId || "") === context.exerciseId &&
    String(draft.sourcePostId || "") === context.sourcePostId
  );
}

export default function CreatePostScreen() {
  const params = useLocalSearchParams();
  const isSubmissionMode = params.mode === "submission";
  const draftLoadedRef = useRef(false);

  const [content, setContent] = useState("");
  const [sourcePost, setSourcePost] = useState(null);
  const [selectedVideos, setSelectedVideos] = useState([null, null]);
  const [session, setSession] = useState(null);
  const [profileUser, setProfileUser] = useState(null);
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const [textAreaHeight, setTextAreaHeight] = useState(26);
  const [showDraftSheet, setShowDraftSheet] = useState(false);
  const [activeVideoUri, setActiveVideoUri] = useState("");

  const selectedVideoCount = selectedVideos.filter(Boolean).length;
  const role = String(session?.role || session?.user?.role || "").toUpperCase();
  const isStudent = role === "HV";
  const isTeacher = role === "GV";
  const draftContext = useMemo(
    () => ({
      mode: buildDraftMode(isSubmissionMode),
      courseId: String(params.courseId || ""),
      exerciseId: String(params.exerciseId || ""),
      sourcePostId: String(params.sourcePostId || ""),
    }),
    [isSubmissionMode, params.courseId, params.exerciseId, params.sourcePostId],
  );

  const exercise = useMemo(() => {
    const exerciseId = String(params.exerciseId || "").trim();

    if (!exerciseId) {
      return null;
    }

    return {
      id: exerciseId,
      sourcePostId: String(params.sourcePostId || exerciseId),
      title: String(params.exerciseTitle || "Bài tập"),
    };
  }, [params.exerciseId, params.exerciseTitle, params.sourcePostId]);

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
    let isMounted = true;

    if (draftLoadedRef.current) {
      return () => {
        isMounted = false;
      };
    }

    draftLoadedRef.current = true;
    readCache(CACHE_KEY_CREATEPOST_DRAFT).then((draft) => {
      if (!isMounted || !isMatchingDraftContext(draft, draftContext)) {
        return;
      }

      setContent(typeof draft.content === "string" ? draft.content : "");
      setSelectedVideos(hydrateDraftVideos(draft.selectedVideos));
    });

    return () => {
      isMounted = false;
    };
  }, [draftContext]);

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
      fieldName: slotIndex === 0 ? "left_video" : "right_video",
      isLocalUpload: true,
      duration,
      fileSize: asset.fileSize || 0,
    };
  };

  const pickCreateVideo = async (slotIndex) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["videos"],
      allowsEditing: false,
      quality: 1,
    });

    if (result.canceled || !result.assets?.[0]) {
      return;
    }

    const video = await buildVideoItem(result.assets[0], slotIndex);
    setSelectedVideos((current) =>
      current.map((item, index) => (index === slotIndex ? video : item)),
    );
  };

  const removeSelectedVideo = (index) => {
    const removedUri = selectedVideos[index]?.uri || "";
    if (!removedUri) return;

    Alert.alert("Xóa video", "Bạn có chắc muốn xóa video này?", [
      {
        text: "Hủy",
        style: "cancel",
      },
      {
        text: "Xóa",
        style: "destructive",
        onPress: () => {
          setSelectedVideos((current) =>
            current.map((item, itemIndex) => (itemIndex === index ? null : item)),
          );
          setActiveVideoUri((current) => (current === removedUri ? "" : current));
        },
      },
    ]);
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
    const trimmedContent = content.trim();

    if (isSubmissionMode && (!params.courseId || !params.exerciseId)) {
      Alert.alert(
        "Thiếu thông tin bài tập",
        "Không tìm thấy khóa học hoặc bài tập để nộp bài.",
      );
      return;
    }

    if (isSubmissionMode && completeVideos.length !== 2) {
      Alert.alert("Thiếu video", "Bài nộp cần đúng 2 video.");
      return;
    }

    try {
      validateTwoVideos(completeVideos);
    } catch (error) {
      Alert.alert(
        "Video chưa hợp lệ",
        error?.message || "Vui lòng kiểm tra lại video trước khi đăng.",
      );
      return;
    }

    const avatarUri =
      profileUser?.avatar ||
      session?.avatar ||
      session?.user?.avatar ||
      "https://ui-avatars.com/api/?name=User&background=random";
    const uploadingId = enqueuePostUploading({ avatarUri });

    router.replace("/(tabs)/home");

    void (async () => {
      try {
        const newPost = isSubmissionMode
          ? await createExerciseSubmission({
              content: trimmedContent,
              videos: completeVideos,
              courseId: String(params.courseId || ""),
              exerciseId: String(params.exerciseId || exercise?.id || ""),
              sourcePostId: params.sourcePostId || sourcePost?.id || "",
            })
          : await createPost({
              content: trimmedContent,
              videos: completeVideos,
            });

        writeCache(CACHE_KEY_CREATEPOST_DRAFT, null);
        resolvePostUploading(uploadingId, newPost || null);
      } catch (error) {
        rejectPostUploading(uploadingId);
        if (await redirectIfSessionExpired(error, router)) return;
        console.warn("Failed to create post:", error);
        Alert.alert(
          "Đăng bài thất bại",
          error.message || "Không thể tạo bài viết. Vui lòng thử lại.",
        );
      }
    })();
  };

  const handleBack = () => {
    if (content.trim() || selectedVideoCount > 0) {
      setShowDraftSheet(true);
    } else {
      router.back();
    }
  };

  const handleSaveDraft = () => {
    writeCache(CACHE_KEY_CREATEPOST_DRAFT, {
      ...draftContext,
      content,
      selectedVideos: serializeDraftVideos(selectedVideos),
      savedAt: new Date().toISOString(),
    });
    setShowDraftSheet(false);
    Alert.alert("Đã lưu bản nháp", "Bản nháp của bạn đã được lưu cục bộ.");
    router.back();
  };

  const handleDiscard = () => {
    writeCache(CACHE_KEY_CREATEPOST_DRAFT, null);
    setShowDraftSheet(false);
    router.back();
  };

  const isSubmitDisabled = selectedVideoCount !== 2;
  const bottomToolbarInset = keyboardOffset;

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
            {isSubmissionMode ? "NỘP" : "ĐĂNG"}
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
                <EarthIcon />
                <Text style={createStyles.privacyText}>Công khai</Text>
              </View>
            </View>
          </View>

          {isSubmissionMode ? (
            <Text style={createStyles.modeHint}>
              Nộp 2 video thật, mỗi video tối thiểu 10 giây và thời lượng tương đương nhau.
            </Text>
          ) : null}

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

          <View style={createStyles.videoGrid}>
            {VIDEO_SLOTS.map((slot, index) => {
              const video = selectedVideos[index];

              return (
                <View key={slot.key} style={createStyles.videoCard}>
                  {video?.uri ? (
                    <>
                      <Pressable
                        style={createStyles.videoRemoveButton}
                        onPress={() => removeSelectedVideo(index)}
                        hitSlop={8}
                      >
                        <CircleWithCrossIcon />
                      </Pressable>
                      <PostVideoPreview
                        video={video}
                        label={slot.label}
                        onPress={() => setActiveVideoUri(video.uri)}
                      />
                    </>
                  ) : (
                    <PostVideoUploadSlot
                      label={slot.label}
                      emptyText={slot.emptyText}
                      onPress={() => pickCreateVideo(index)}
                    />
                  )}
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>

      <DraftActionSheet
        visible={showDraftSheet}
        onClose={() => setShowDraftSheet(false)}
        onSaveDraft={handleSaveDraft}
        onDiscard={handleDiscard}
        onContinue={() => setShowDraftSheet(false)}
      />
      <PostVideoFullscreenModal
        visible={Boolean(activeVideoUri)}
        uri={activeVideoUri}
        onClose={() => setActiveVideoUri("")}
      />
    </Screen>
  );
}
