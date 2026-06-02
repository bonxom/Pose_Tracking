import NoInternetView from "@/components/common/NoInternetView";
import PostCard from "@/components/post/PostCard";
import PostUploadingCard from "@/components/post/PostUploadingCard";
import { useInternetFetch } from "@/hooks/useNetInfo";
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
import { CACHE_KEY_HOME_FEED, readCache, writeCache } from "@/utils/cacheStore";
import { redirectIfSessionExpired } from "@/utils/screenErrors";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  LayoutAnimation,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";

let homeFeedCache = [];

export default function HomeScreen() {
  const uploadSuccessAlertLock = useRef(false);
  const diskCacheLoadedRef = useRef(false);
  const [posts, setPosts] = useState(homeFeedCache);
  const [isLoading, setIsLoading] = useState(homeFeedCache.length === 0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [lastId, setLastId] = useState("");
  const [newItemsCount, setNewItemsCount] = useState(0);
  const [uploadingCards, setUploadingCards] = useState([]);
  const { isNoInternet, executeWithInternetCheck } = useInternetFetch();

  // Load persistent cache from disk once per app session, then replace
  // useEffect-based fetch with useFocusEffect so the feed silently
  // background-refreshes every time the user returns to this tab.
  const loadPosts = useCallback(async ({ refresh = false } = {}) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
      } else if (homeFeedCache.length === 0) {
        // Only show full-screen spinner when there is truly nothing to show
        setIsLoading(true);
      }
      await executeWithInternetCheck(async () => {
        const result = await getFeedPage({ index: 0, count: 20, lastId: "" });
        const nextItems = result.items || [];
        if (!refresh && nextItems.length === 0 && homeFeedCache.length > 0) {
          setPosts(homeFeedCache);
        } else {
          homeFeedCache = nextItems;
          setPosts(nextItems);
          writeCache(CACHE_KEY_HOME_FEED, nextItems);
        }
        setHasMore(Boolean(result.hasMore));
        setLastId(result.lastId || "");
        setNewItemsCount(Number(result.newItems || 0));
      });
    } catch (error) {
      console.warn("Failed to load posts:", error);
      if (await redirectIfSessionExpired(error, router)) return;
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      // In-memory cache already populated → render instantly, refresh in background
      if (homeFeedCache.length > 0) {
        setIsLoading(false);
        loadPosts();
        return;
      }

      // No in-memory cache: try disk first, then fetch
      if (!diskCacheLoadedRef.current) {
        diskCacheLoadedRef.current = true;
        readCache(CACHE_KEY_HOME_FEED).then((cached) => {
          if (cached?.length > 0 && homeFeedCache.length === 0) {
            homeFeedCache = cached;
            setPosts(cached);
            setIsLoading(false);
          }
          // Either way, fetch fresh data in background
          loadPosts();
        });
      } else {
        loadPosts();
      }
    }, [loadPosts]),
  );

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore || !lastId) return;

    try {
      setIsLoadingMore(true);
      const result = await getFeedPage({
        index: posts.length,
        count: 20,
        lastId,
      });
      setPosts((current) => {
        const next = [...current, ...(result.items || [])];
        homeFeedCache = next;
        writeCache(CACHE_KEY_HOME_FEED, next);
        return next;
      });
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

        const next = uniqueNewPosts.length
          ? [...uniqueNewPosts, ...current]
          : current;
        homeFeedCache = next;
        return next;
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

  const handleDeletePost = useCallback((postId) => {
    if (!postId) return;

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setPosts((current) => {
      const next = current.filter((item) => item.id !== postId);
      homeFeedCache = next;
      return next;
    });
  }, []);

  const feedItems = useMemo(() => {
    const uploadingItems = uploadingCards.map((item) => ({
      id: item.id,
      __uploading: true,
      avatarUri: item.avatarUri,
    }));

    return [...uploadingItems, ...posts];
  }, [posts, uploadingCards]);

  if (
    (isLoading || isNoInternet) &&
    posts.length === 0 &&
    uploadingCards.length === 0
  ) {
    return (
      <View style={[homeStyles.container, { flex: 1 }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={homeStyles.container}>
      {isNoInternet && posts.length === 0 ? (
        <NoInternetView
          style={{ minHeight: 400 }}
          onRefresh={() => loadPosts({ refresh: true })}
          refreshing={isRefreshing}
        />
      ) : (
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
                onDeletePost={(deletedPostId) =>
                  handleDeletePost(deletedPostId || item.id)
                }
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
      )}
    </View>
  );
}
