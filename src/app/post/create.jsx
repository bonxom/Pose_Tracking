import AppButton from "@/components/common/AppButton";
import AppInput from "@/components/common/AppInput";
import Screen from "@/components/common/Screen";
import { DEMO_COURSE, DEMO_EXERCISES, DEMO_VIDEO_PLACEHOLDERS } from "@/constants/demo";
import { createExerciseSubmission, createPost, getPostById } from "@/repositories/postRepository";
import { ACTIVE_SOURCES } from "@/repositories/source";
import postStyles from "@/styles/post.styles";
import { getAuthSession } from "@/utils/session";
import { redirectIfSessionExpired } from "@/utils/screenErrors";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";

export default function CreatePostScreen() {
  const params = useLocalSearchParams();
  const isSubmissionMode = params.mode === "submission";
  const [content, setContent] = useState("");
  const [sourcePost, setSourcePost] = useState(null);
  const [selectedVideos, setSelectedVideos] = useState([]);
  const [session, setSession] = useState(null);
  const [statusText, setStatusText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const selectedVideoCount = selectedVideos.filter(Boolean).length;

  const exercise = useMemo(() => {
    return (
      DEMO_EXERCISES.find((item) => item.id === params.exerciseId) ||
      DEMO_EXERCISES[0]
    );
  }, [params.exerciseId]);

  useEffect(() => {
    const loadSourcePost = async () => {
      setSession(await getAuthSession());
      if (!params.sourcePostId) return;
      const post = await getPostById(params.sourcePostId);
      setSourcePost(post);
    };

    loadSourcePost();
  }, [params.sourcePostId]);

  const addDemoVideo = (video) => {
    setSelectedVideos((current) => {
      if (current.some((item) => item?.id === video.id)) {
        return current;
      }
      return [...current, video].slice(0, 2);
    });
  };

  const useBothDemoVideos = () => {
    setSelectedVideos(DEMO_VIDEO_PLACEHOLDERS);
  };

  const isLocalSession = session?.demoMode || session?.source === ACTIVE_SOURCES.LOCAL;

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

  const pickRealVideo = async (slotIndex) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: false,
      quality: 1,
    });

    if (result.canceled || !result.assets?.[0]) {
      return;
    }

    const asset = result.assets[0];
    const duration = await readVideoDuration(asset);
    const video = {
      id: `real_video_${slotIndex}_${Date.now()}`,
      uri: asset.uri,
      file: asset.file,
      name: asset.fileName || `real-video-${slotIndex + 1}.mp4`,
      mimeType: asset.mimeType || "video/mp4",
      angle: slotIndex === 0 ? "Góc quay trái" : "Góc quay phải",
      duration,
      fileSize: asset.fileSize || 0,
    };

    setSelectedVideos((current) => {
      const next = [...current];
      next[slotIndex] = video;
      return next.slice(0, 2);
    });
  };

  const handleCreatePost = async () => {
    const completeVideos = selectedVideos.filter(Boolean);
    if (completeVideos.length !== 2) {
      Alert.alert("Thiếu video", "Bài viết cần đúng 2 video.");
      return;
    }

    if (!isSubmissionMode && !content.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập nội dung bài viết");
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
        Alert.alert(
          "Thành công",
          isSubmissionMode
            ? isLocalSession ? "Bài nộp local đã được chấm demo." : "Bài nộp đã được gửi lên server."
            : "Bài viết đã được tạo",
        );
        router.replace(`/post/${newPost.id}`);
      }
    } catch (error) {
      console.warn("Failed to create post:", error);
      if (await redirectIfSessionExpired(error, router)) return;
      setStatusText(error.message || "Không thể tạo bài viết. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Screen style={postStyles.screen}>
      <ScrollView
        contentContainerStyle={postStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={postStyles.title}>
          {isSubmissionMode ? "Nộp bài tập" : "Tạo bài viết mới"}
        </Text>
        <Text style={postStyles.subtitle}>
          {isSubmissionMode
            ? isLocalSession
              ? "Local fallback có thể dùng placeholder demo. Server mode cần 2 video thật."
              : "Nộp 2 video thật, mỗi video tối thiểu 10 giây và thời lượng tương đương nhau."
            : "Bài viết server cần đúng 2 video thật theo yêu cầu IT4788."}
        </Text>
        {statusText ? <Text style={postStyles.warningText}>{statusText}</Text> : null}

        {isSubmissionMode ? (
          <View style={postStyles.infoCard}>
            <Text style={postStyles.infoTitle}>{exercise.title}</Text>
            <Text style={postStyles.infoText}>{DEMO_COURSE.title}</Text>
            <Text style={postStyles.infoText}>
              {DEMO_COURSE.hashtag} {exercise.hashtag}
            </Text>
          </View>
        ) : null}

        <View style={postStyles.inputCard}>
          <Text style={postStyles.slotLabel}>
            {isSubmissionMode ? "Ghi chú bài nộp" : "Nội dung"}
          </Text>
          <AppInput
            placeholder={
              isSubmissionMode
                ? "Ví dụ: Em nộp bài với 2 góc quay theo hướng dẫn..."
                : "Viết nội dung bài viết của bạn..."
            }
            value={content}
            onChangeText={setContent}
            multiline
            numberOfLines={6}
            style={postStyles.textArea}
          />
          <Text style={postStyles.slotHint}>{content.length} ký tự</Text>
        </View>

        <View style={postStyles.inputCard}>
          <Text style={postStyles.slotLabel}>Video bài viết</Text>
          <View style={postStyles.actionRow}>
            <AppButton
              title="Chọn video trái"
              onPress={() => pickRealVideo(0)}
              style={[postStyles.actionButton, postStyles.secondaryButton]}
              textStyle={postStyles.secondaryButtonText}
            />
            <AppButton
              title="Chọn video phải"
              onPress={() => pickRealVideo(1)}
              style={[postStyles.actionButton, postStyles.secondaryButton]}
              textStyle={postStyles.secondaryButtonText}
            />
          </View>
          <View style={postStyles.mediaList}>
            {[0, 1].map((slotIndex) => {
              const video = selectedVideos[slotIndex];
              return (
                <View key={slotIndex} style={postStyles.mediaCard}>
                  <Text style={postStyles.mediaTitle}>{slotIndex === 0 ? "Góc quay trái" : "Góc quay phải"}</Text>
                  <Text style={postStyles.mediaSubtitle}>{video?.name || "Chưa chọn video thật"}</Text>
                  <Text style={postStyles.mediaSubtitle}>
                    {video?.duration ? `${Math.round(video.duration / 1000)} giây` : "Cần video >= 10 giây"}
                  </Text>
                </View>
              );
            })}
          </View>
          <Text style={postStyles.slotHint}>Đã chọn {selectedVideoCount}/2 video.</Text>
        </View>

        {isSubmissionMode && isLocalSession ? (
          <View style={postStyles.inputCard}>
            <Text style={postStyles.slotLabel}>Placeholder local-only</Text>
            <View style={postStyles.mediaList}>
              {DEMO_VIDEO_PLACEHOLDERS.map((video) => {
                const selected = selectedVideos.some((item) => item?.id === video.id);
                return (
                  <View
                    key={video.id}
                    style={[
                      postStyles.mediaCard,
                      selected && postStyles.selectedMediaCard,
                    ]}
                  >
                    <Text style={postStyles.mediaTitle}>{video.angle}</Text>
                    <Text style={postStyles.mediaSubtitle}>{video.name}</Text>
                    <Text style={postStyles.mediaSubtitle}>
                      {selected ? "Đã chọn cho demo" : "Chưa chọn"}
                    </Text>
                    <AppButton
                      title={selected ? "Đã dùng" : `Use demo video ${video.id.endsWith("left_video") ? "1" : "2"}`}
                      onPress={() => addDemoVideo(video)}
                      disabled={selected}
                      style={[postStyles.actionButton, postStyles.secondaryButton]}
                      textStyle={postStyles.secondaryButtonText}
                    />
                  </View>
                );
              })}
            </View>
            <AppButton title="Dùng đủ 2 video demo" onPress={useBothDemoVideos} />
            <Text style={postStyles.slotHint}>
              Placeholder không bao giờ được gửi lên backend server.
            </Text>
          </View>
        ) : null}

        <AppButton
          title={
            isSubmitting
              ? "Đang xử lý..."
              : isSubmissionMode
                ? isLocalSession ? "Nộp bài local" : "Nộp bài lên server"
                : "Đăng bài"
          }
          onPress={handleCreatePost}
          disabled={isSubmitting || selectedVideoCount !== 2 || (!isSubmissionMode && !content.trim())}
        />

        <AppButton
          title="Hủy"
          onPress={() => router.back()}
          style={[postStyles.actionButton, postStyles.secondaryButton]}
          textStyle={postStyles.secondaryButtonText}
        />
      </ScrollView>
    </Screen>
  );
}
