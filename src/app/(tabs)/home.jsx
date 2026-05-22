import PostCard from "@/components/post/PostCard";
import PostUploadingCard from "@/components/post/PostUploadingCard";
import {
  // checkNewItems,
  getFeedPage,
  toggleLike,
} from "@/repositories/postRepository";
import {
  consumeFinishedUploadedPosts,
  subscribePostUploading,
} from "@/services/postUploadingStore";
import homeStyles from "@/styles/home.styles";
import { redirectIfSessionExpired } from "@/utils/screenErrors";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";

export default function HomeScreen() {
  const uploadSuccessAlertLock = useRef(false);
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [lastId, setLastId] = useState("");
  const [newItemsCount, setNewItemsCount] = useState(0);
  const [uploadingCards, setUploadingCards] = useState([]);

  const loadPosts = useCallback(async ({ refresh = false } = {}) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      const result = await getFeedPage({ index: 0, count: 20, lastId: "" });
      setPosts(result.items || []);
      setHasMore(Boolean(result.hasMore));
      setLastId(result.lastId || "");
      setNewItemsCount(Number(result.newItems || 0));
    } catch (error) {
      console.warn("Failed to load posts:", error);
      if (await redirectIfSessionExpired(error, router)) return;
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore || !lastId) return;

    try {
      setIsLoadingMore(true);
      const result = await getFeedPage({
        index: posts.length,
        count: 20,
        lastId,
      });
      setPosts((current) => [...current, ...(result.items || [])]);
      setHasMore(Boolean(result.hasMore));
      setLastId(result.lastId || lastId);
    } catch (error) {
      console.warn("Failed to load more posts:", error);
      if (await redirectIfSessionExpired(error, router)) return;
    } finally {
      setIsLoadingMore(false);
    }
  }, [hasMore, isLoadingMore, lastId, posts.length]);

  // const checkForNewItems = useCallback(async () => {
  //   try {
  //     const result = await checkNewItems(lastId);
  //     setNewItemsCount(Number(result.count || 0));
  //   } catch (error) {
  //     if (await redirectIfSessionExpired(error, router)) return;
  //     console.warn("Failed to check new items:", error);
  //   }
  // }, [lastId]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const showUploadSuccessAlert = useCallback(() => {
    if (uploadSuccessAlertLock.current) return;

    uploadSuccessAlertLock.current = true;
    Alert.alert("Thông báo", "Bài viết đã được đăng", [
      {
        text: "OK",
        onPress: () => {
          uploadSuccessAlertLock.current = false;
          void loadPosts({ refresh: true });
        },
        // cứ tắt alert là refresh
        onDismiss: () => {
          uploadSuccessAlertLock.current = false;
          void loadPosts({ refresh: true });
        },
      },
    ]);
  }, [loadPosts]);

  useEffect(() => {
    return subscribePostUploading((nextState) => {
      setUploadingCards(nextState.uploadingCards || []);

      if (!nextState.finishedPosts?.length) {
        return;
      }

      const completedPosts = consumeFinishedUploadedPosts();
      if (!completedPosts.length) {
        return;
      }

      setPosts((current) => {
        const existingIds = new Set(current.map((item) => item.id));
        const uniqueNewPosts = completedPosts.filter(
          (item) => item?.id && !existingIds.has(item.id),
        );

        return uniqueNewPosts.length
          ? [...uniqueNewPosts, ...current]
          : current;
      });

      showUploadSuccessAlert();
    });
  }, [showUploadSuccessAlert]);

  // useEffect(() => {
  //   const timer = setInterval(checkForNewItems, 60_000);
  //   return () => clearInterval(timer);
  // }, [checkForNewItems]);

  const handleToggleLike = async (post) => {
    try {
      const updatedPost = await toggleLike(post);
      setPosts((prevPosts) =>
        prevPosts.map((p) => (p.id === post.id ? updatedPost : p)),
      );
    } catch (error) {
      console.warn("Failed to toggle like:", error);
      if (await redirectIfSessionExpired(error, router)) return;
    }
  };

  const handlePostPress = (postId) => {
    router.push(`/post/${postId}`);
  };

  const handleCommentPress = (postId) => {
    router.push(`/post/comment/${postId}`);
  };

  const handleSubmitExercise = (post) => {
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

  const feedItems = useMemo(() => {
    const uploadingItems = uploadingCards.map((item) => ({
      id: item.id,
      __uploading: true,
      avatarUri: item.avatarUri,
    }));

    return [...uploadingItems, ...posts];
  }, [posts, uploadingCards]);

  if (isLoading) {
    return (
      <View style={[homeStyles.container, { flex: 1 }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={homeStyles.container}>
      <View style={{ flex: 1, width: "100%" }}>
        {/* <View style={homeStyles.headerCard}>
          <Text style={homeStyles.title}>IT4788 PoseFeed</Text>
          <Text style={homeStyles.subtitle}>
            Bài tập diễu binh, bài nộp học viên và kết quả chấm tự động
          </Text>
          <Text style={homeStyles.sourceLabel}>{sourceLabel}</Text>
          {errorText ? (
            <Text style={homeStyles.errorText}>{errorText}</Text>
          ) : null}
        </View> */}

        <FlatList
          data={feedItems}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => loadPosts({ refresh: true })}
            />
          }
          ListHeaderComponent={
            newItemsCount > 0 ? (
              <Pressable
                style={homeStyles.newItemsButton}
                onPress={() => loadPosts({ refresh: true })}
              >
                <Text style={homeStyles.newItemsText}>
                  {newItemsCount} bài mới - tải lại
                </Text>
              </Pressable>
            ) : null
          }
          renderItem={({ item }) =>
            item.__uploading ? (
              <PostUploadingCard avatarUri={item.avatarUri} />
            ) : (
              <PostCard
                post={item}
                flat
                onPress={() => handlePostPress(item.id)}
                onToggleLike={() => handleToggleLike(item)}
                onPressComment={() => handleCommentPress(item.id)}
                onSubmitExercise={() => handleSubmitExercise(item)}
              />
            )
          }
          ItemSeparatorComponent={() => <View style={homeStyles.postDivider} />}
          ListEmptyComponent={
            <Text style={homeStyles.subtitle}>Không có bài viết nào</Text>
          }
          ListFooterComponent={
            isLoadingMore ? (
              <ActivityIndicator style={{ paddingVertical: 16 }} />
            ) : hasMore ? (
              <Text style={homeStyles.subtitle}>Kéo xuống để tải thêm</Text>
            ) : null
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.35}
        />
      </View>
    </View>
  );
}
