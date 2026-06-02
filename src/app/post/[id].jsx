import AppButton from "@/components/common/AppButton";
import AppInput from "@/components/common/AppInput";
import Screen from "@/components/common/Screen";
import PostCard from "@/components/post/PostCard";
import { addComment, getComments } from "@/repositories/commentRepository";
import { deletePost, editPost, getPostById, reportPost, toggleLike } from "@/repositories/postRepository";
import postStyles from "@/styles/post.styles";
import { getAuthSession } from "@/utils/session";
import { redirectIfSessionExpired } from "@/utils/screenErrors";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, View } from "react-native";

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [session, setSession] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const [editVideos, setEditVideos] = useState([]);
  const [reportReason, setReportReason] = useState("");
  const [statusText, setStatusText] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadPost = useCallback(async () => {
    try {
      setIsLoading(true);
      const currentSession = await getAuthSession();
      setSession(currentSession);
      const data = await getPostById(id);
      setPost(data);
      setEditText(data?.content || data?.described || "");
      const commentResult = await getComments(data || id, { index: 0, count: 50 });
      setComments(commentResult.comments || []);
    } catch (error) {
      console.warn("Failed to load post:", error);
      if (await redirectIfSessionExpired(error, router)) return;
      setStatusText(error.message || "Không thể tải bài viết.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadPost();
  }, [loadPost]);

  const handleToggleLike = async () => {
    if (!post) return;
    try {
      const updatedPost = await toggleLike(post);
      setPost(updatedPost);
    } catch (error) {
      console.warn("Failed to toggle like:", error);
      if (await redirectIfSessionExpired(error, router)) return;
      setStatusText(error.message || "Không thể cập nhật lượt thích.");
    }
  };

  const handleSubmitExercise = () => {
    if (!post) return;
    router.push({
      pathname: "/post/create",
      params: {
        mode: "submission",
        sourcePostId: post.id,
        courseId: post.courseId,
        exerciseId: post.exerciseId,
        teacherId: post.author?.id || "",
      },
    });
  };

  const handleNavigateEdit = () => {
    if (!post?.id) return;
    router.push({
      pathname: "/post/edit",
      params: {
        id: post.id,
      },
    });
  };

  const handleAddComment = async () => {
    const normalizedComment = commentText.trim().replace(/[\u0000-\u001F\u007F]/g, " ");
    if (!normalizedComment) {
      Alert.alert("Lỗi", "Vui lòng nhập bình luận");
      return;
    }

    if (normalizedComment.length > 500) {
      Alert.alert("Lỗi", "Bình luận tối đa 500 ký tự.");
      return;
    }

    try {
      const result = await addComment(post, normalizedComment);
      if (result.comment) {
        setComments((current) => [...current, result.comment]);
        setCommentText("");
        const updatedPost = await getPostById(post.id);
        setPost(updatedPost);
      }
    } catch (error) {
      if (await redirectIfSessionExpired(error, router)) return;
      setStatusText(error.message || "Không thể gửi bình luận.");
    }
  };

  const canOwnerEdit = post?.author?.id && session?.id && post.author.id === session.id && session.role === "HV";

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

  const pickReplacementVideo = async (slotIndex) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: false,
      quality: 1,
    });

    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    const duration = await readVideoDuration(asset);
    const video = {
      id: `edit_video_${slotIndex}_${Date.now()}`,
      uri: asset.uri,
      file: asset.file,
      name: asset.fileName || `replacement-video-${slotIndex + 1}.mp4`,
      mimeType: asset.mimeType || "video/mp4",
      angle: slotIndex === 0 ? "Góc quay trái" : "Góc quay phải",
      duration,
      fileSize: asset.fileSize || 0,
    };

    setEditVideos((current) => {
      const next = [...current];
      next[slotIndex] = video;
      return next.slice(0, 2);
    });
  };

  const handleEditPost = async () => {
    const replacementVideos = editVideos.filter(Boolean);

    if (!editText.trim()) {
      setStatusText("Mô tả bài viết không được bỏ trống.");
      return;
    }

    if (replacementVideos.length === 1) {
      setStatusText("Nếu thay video, cần chọn đủ cả 2 video theo quy định.");
      return;
    }

    try {
      const updated = await editPost(post, {
        content: editText.trim(),
        videos: replacementVideos.length === 2 ? replacementVideos : undefined,
      });
      setPost(updated);
      setIsEditing(false);
      setEditVideos([]);
      setStatusText("Đã cập nhật bài viết.");
    } catch (error) {
      if (await redirectIfSessionExpired(error, router)) return;
      setStatusText("Hệ thống đang lỗi, vui lòng thử lại sau");
    }
  };

  const handleDeletePost = async () => {
    try {
      await deletePost(post);
      Alert.alert("Thành công", "Đã xóa bài viết thành công.", [
        {
          text: "OK",
          onPress: () => router.replace("/(tabs)/home"),
        },
      ]);
    } catch (error) {
      if (await redirectIfSessionExpired(error, router)) return;
      setStatusText("Hệ thống đang lỗi, vui lòng thử lại sau");
    }
  };

  const handleReportPost = async () => {
    try {
      await reportPost(post, reportReason.trim() || "Báo cáo nội dung bài viết");
      setReportReason("");
      setStatusText("Đã gửi báo cáo.");
    } catch (error) {
      if (await redirectIfSessionExpired(error, router)) return;
      setStatusText(error.message || "Không thể báo cáo bài viết.");
    }
  };

  if (isLoading) {
    return (
      <Screen style={postStyles.screen}>
        <ActivityIndicator size="large" />
      </Screen>
    );
  }

  if (!post) {
    return (
      <Screen style={postStyles.screen}>
        <Text style={postStyles.title}>Bài viết không tồn tại</Text>
      </Screen>
    );
  }

  return (
    <Screen style={postStyles.screen}>
      <ScrollView
        contentContainerStyle={postStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <PostCard
          post={post}
          detail={true}
          onToggleLike={handleToggleLike}
          onPressComment={() => router.push(`/post/comment/${post.id}`)}
          onSubmitExercise={handleSubmitExercise}
          onEditPost={canOwnerEdit ? handleNavigateEdit : undefined}
        />

        {statusText ? <Text style={postStyles.warningText}>{statusText}</Text> : null}

        <View style={postStyles.inputCard}>
          <Text style={postStyles.slotLabel}>Thao tác bài viết</Text>
          {canOwnerEdit ? (
            <>
              {isEditing ? (
                <>
                  <AppInput
                    value={editText}
                    onChangeText={setEditText}
                    multiline
                    numberOfLines={4}
                    style={postStyles.textArea}
                  />
                  <Text style={postStyles.slotHint}>
                    Thay video là tùy chọn. Nếu thay, phải chọn đủ 2 video thật, mỗi video tối thiểu 10 giây và thời lượng tương đương.
                  </Text>
                  <View style={postStyles.actionRow}>
                    <AppButton
                      title="Thay video trái"
                      onPress={() => pickReplacementVideo(0)}
                      style={[postStyles.actionButton, postStyles.secondaryButton]}
                      textStyle={postStyles.secondaryButtonText}
                    />
                    <AppButton
                      title="Thay video phải"
                      onPress={() => pickReplacementVideo(1)}
                      style={[postStyles.actionButton, postStyles.secondaryButton]}
                      textStyle={postStyles.secondaryButtonText}
                    />
                  </View>
                  <View style={postStyles.mediaList}>
                    {[0, 1].map((slotIndex) => {
                      const video = editVideos[slotIndex];
                      return (
                        <View key={slotIndex} style={postStyles.mediaCard}>
                          <Text style={postStyles.mediaTitle}>{slotIndex === 0 ? "Góc quay trái" : "Góc quay phải"}</Text>
                          <Text style={postStyles.mediaSubtitle}>{video?.name || "Giữ video hiện tại"}</Text>
                          <Text style={postStyles.mediaSubtitle}>
                            {video?.duration ? `${Math.round(video.duration / 1000)} giây` : "Chưa chọn video thay thế"}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                  <View style={postStyles.actionRow}>
                    <AppButton title="Lưu sửa" onPress={handleEditPost} style={postStyles.actionButton} />
                    <AppButton
                      title="Hủy sửa"
                      onPress={() => {
                        setIsEditing(false);
                        setEditVideos([]);
                      }}
                      style={[postStyles.actionButton, postStyles.secondaryButton]}
                      textStyle={postStyles.secondaryButtonText}
                    />
                  </View>
                </>
              ) : (
                <View style={postStyles.actionRow}>
                  <AppButton title="Sửa bài" onPress={() => setIsEditing(true)} style={postStyles.actionButton} />
                  <AppButton
                    title="Xóa bài"
                    onPress={handleDeletePost}
                    style={[postStyles.actionButton, postStyles.secondaryButton]}
                    textStyle={postStyles.secondaryButtonText}
                  />
                </View>
              )}
            </>
          ) : (
            <>
              <AppInput
                placeholder="Lý do báo cáo..."
                value={reportReason}
                onChangeText={setReportReason}
              />
              <AppButton title="Báo cáo bài viết" onPress={handleReportPost} style={postStyles.actionButton} />
            </>
          )}
        </View>

        <View style={postStyles.divider} />

        <View style={postStyles.inputCard}>
          <Text style={postStyles.slotLabel}>Bình luận ({comments.length})</Text>
          {comments.map((item) => (
            <View key={item.id} style={postStyles.commentCard}>
              <Text style={postStyles.commentAuthor}>{item.authorName}</Text>
              {item.isScoreComment && item.score ? (
                <Text style={postStyles.scoreSummaryTitle}>Điểm: {item.score}/100</Text>
              ) : null}
              <Text style={postStyles.commentText}>{item.content}</Text>
              <Text style={postStyles.commentMeta}>
                {new Date(item.createdAt).toLocaleDateString("vi-VN")}
              </Text>
            </View>
          ))}
          {post.canComment === false ? (
            <Text style={postStyles.lockedText}>Bài viết này không cho phép bình luận.</Text>
          ) : (
            <>
              <AppInput
                placeholder="Viết bình luận..."
                value={commentText}
                onChangeText={setCommentText}
                multiline
                numberOfLines={3}
                style={postStyles.textArea}
              />
              <Text style={postStyles.slotHint}>{commentText.length}/500 ký tự</Text>
              <AppButton
                title="Gửi bình luận"
                onPress={handleAddComment}
                disabled={!commentText.trim() || commentText.length > 500}
              />
            </>
          )}
        </View>

        <View style={{ height: 12 }} />

        <AppButton
          title="Quay lại"
          onPress={() => router.back()}
          style={[postStyles.actionButton, postStyles.secondaryButton]}
          textStyle={postStyles.secondaryButtonText}
        />
      </ScrollView>
    </Screen>
  );
}
