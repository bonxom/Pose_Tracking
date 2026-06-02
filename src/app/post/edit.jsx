import Screen from "@/components/common/Screen";
import DraftActionSheet from "@/components/post/DraftActionSheet";
import {
  normalizeVideoSlots,
  PostVideoFullscreenModal,
  PostVideoPreview,
  PostVideoUploadSlot,
  VIDEO_SLOTS,
} from "@/components/post/PostVideoSlots";
import CircleWithCrossIcon from "@/components/icons/CircleWithCrossIcon";
import EarthIcon from "@/components/icons/EarthIcon";
import colors from "@/constants/colors";
import {
  editPost,
  getPostById,
  validateEditableVideos,
} from "@/repositories/postRepository";
import {
  enqueuePostUploading,
  rejectPostUploading,
  resolvePostUploading,
} from "@/services/postUploadingStore";
import { getUserInfo } from "@/repositories/userRepository";
import createStyles from "@/styles/post/create.styles";
import postStyles from "@/styles/post.styles";
import { redirectIfSessionExpired } from "@/utils/screenErrors";
import { getAuthSession } from "@/utils/session";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { createVideoPlayer } from "expo-video";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
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

function normalizeDurationMs(value) {
  const duration = Number(value || 0);
  if (!Number.isFinite(duration) || duration <= 0) return 0;
  return duration > 1000 ? Math.round(duration) : Math.round(duration * 1000);
}

async function readDurationFromVideoUri(uri) {
  if (!uri) return 0;

  if (typeof document !== "undefined") {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () =>
        resolve(normalizeDurationMs(video.duration || 0));
      video.onerror = () => resolve(0);
      video.src = uri;
    });
  }

  const player = createVideoPlayer({ uri });

  return new Promise((resolve) => {
    let settled = false;
    let timeoutId;
    let sourceLoadSubscription;
    let statusChangeSubscription;

    const finish = (value = 0) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      sourceLoadSubscription?.remove();
      statusChangeSubscription?.remove();
      try {
        player.release();
      } catch {}
      resolve(normalizeDurationMs(value));
    };

    const resolvePlayerDuration = (value = 0) => {
      const duration = Number(value || player.duration || 0);
      if (Number.isFinite(duration) && duration > 0) {
        finish(duration);
      }
    };

    sourceLoadSubscription = player.addListener("sourceLoad", (payload) => {
      resolvePlayerDuration(payload?.duration);
    });
    statusChangeSubscription = player.addListener(
      "statusChange",
      (payload) => {
        resolvePlayerDuration();
        if (payload?.error) {
          finish(0);
        }
      },
    );
    timeoutId = setTimeout(() => finish(0), 8000);

    resolvePlayerDuration();
  });
}

async function hydrateVideoDurations(videos = []) {
  if (!Array.isArray(videos) || !videos.length) {
    return videos;
  }

  const nextVideos = await Promise.all(
    videos.map(async (video) => {
      if (!video) return null;

      const duration = normalizeDurationMs(video.duration || video.durationMs);
      if (duration) {
        return {
          ...video,
          duration,
        };
      }

      const probedDuration = await readDurationFromVideoUri(video.uri);
      if (!probedDuration) {
        return video;
      }

      return {
        ...video,
        duration: probedDuration,
      };
    }),
  );

  return nextVideos;
}

export default function EditPostScreen() {
  const params = useLocalSearchParams();
  const postId = String(params.id || "");

  const [post, setPost] = useState(null);
  const [content, setContent] = useState("");
  const [initialContent, setInitialContent] = useState("");
  const [replacementVideos, setReplacementVideos] = useState([null, null]);
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

  const existingVideos = useMemo(
    () => normalizeVideoSlots(post?.videos || []),
    [post?.videos],
  );
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

        const hydratedVideos = await hydrateVideoDurations(
          normalizeVideoSlots(loadedPost.videos || []),
        );

        const initialText = loadedPost.content || loadedPost.described || "";

        if (isMounted) {
          setPost({
            ...loadedPost,
            videos: hydratedVideos,
          });
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
    const duration = normalizeDurationMs(asset.duration || asset.durationMs);
    if (duration) return duration;
    return readDurationFromVideoUri(asset.uri);
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
      fieldName: slotIndex === 0 ? "left_video" : "right_video",
      isLocalUpload: true,
      duration,
      fileSize: asset.fileSize || 0,
    };
  };

  const pickVideo = async (slotIndex) => {
    if (!isReplacingVideos) {
      setIsReplacingVideos(true);
      setReplacementVideos(existingVideos);
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["videos"],
      allowsEditing: false,
      quality: 1,
    });

    if (result.canceled || !result.assets?.[0]) {
      return;
    }

    const video = await buildVideoItem(result.assets[0], slotIndex);
    setReplacementVideos((current) =>
      current.map((item, index) => (index === slotIndex ? video : item)),
    );
  };

  const removeSelectedVideo = (index) => {
    const removedUri = displayedVideos[index]?.uri || "";
    setActiveVideoUri((current) => (current === removedUri ? "" : current));

    if (!isReplacingVideos) {
      setIsReplacingVideos(true);
      setReplacementVideos(
        existingVideos.map((item, itemIndex) => (itemIndex === index ? null : item)),
      );
      return;
    }

    setReplacementVideos((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? null : item)),
    );
  };

  const handleSaveEdit = async () => {
    if (!post || isSubmitting) return;

    const trimmedContent = content.trim();
    if (!trimmedContent) {
      setStatusText("Nội dung bài viết không được để trống.");
      return;
    }

    if (isReplacingVideos && replacementVideoCount !== 2) {
      Alert.alert("Thiếu video", "Nếu thay video, cần chọn đúng 2 video.");
      return;
    }

    setIsSubmitting(true);

    let nextVideos = isReplacingVideos ? replacementVideos : undefined;
    if (nextVideos?.length) {
      try {
        nextVideos = await hydrateVideoDurations(nextVideos);
        setReplacementVideos(nextVideos);
        validateEditableVideos(nextVideos);
      } catch (error) {
        setIsSubmitting(false);
        Alert.alert(
          "Video chưa hợp lệ",
          error?.message || "Vui lòng kiểm tra lại video trước khi cập nhật.",
        );
        return;
      }
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
        await editPost(post, {
          content: trimmedContent,
          videos: nextVideos,
        });
        resolvePostUploading(uploadingId, null);
      } catch (error) {
        rejectPostUploading(uploadingId);
        if (await redirectIfSessionExpired(error, router)) return;
        console.warn("Failed to update post:", error);
        Alert.alert("Lỗi", "Hệ thống đang lỗi, vui lòng thử lại sau");
      }
    })();
  };

  const hasContentChanged = content.trim() !== initialContent.trim();
  const hasVideoChanges =
    isReplacingVideos &&
    replacementVideos.some((video, index) => video?.uri !== existingVideos[index]?.uri);
  const hasDraftChanges = hasContentChanged || hasVideoChanges;

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

  const bottomToolbarInset = keyboardOffset;

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
                <EarthIcon />
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

          <View style={createStyles.videoGrid}>
            {VIDEO_SLOTS.map((slot, index) => {
              const video = displayedVideos[index];

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
                      onPress={() => pickVideo(index)}
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
        discardIconName="close-outline"
        discardLabel="Bỏ thay đổi"
      />
      <PostVideoFullscreenModal
        visible={Boolean(activeVideoUri)}
        uri={activeVideoUri}
        onClose={() => setActiveVideoUri("")}
      />
    </Screen>
  );
}
