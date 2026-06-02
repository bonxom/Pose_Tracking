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
  Animated,
  FlatList,
  LayoutAnimation,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";

let homeFeedCache = [];
const FEED_PAGE_SIZE = 10;
const LOAD_MORE_CARD_DELAY_MS = 1000;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function FeedLoadingCard() {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [animatedValue]);

  return (
    <Animated.View
      style={[
        homeStyles.loadingCard,
        {
          opacity: animatedValue,
          transform: [
            {
              translateY: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [12, 0],
              }),
            },
          ],
        },
      ]}
    >
      <View style={homeStyles.loadingHeader}>
        <View style={homeStyles.loadingAvatar} />
        <View style={homeStyles.loadingMeta}>
          <View style={homeStyles.loadingLinePrimary} />
          <View style={homeStyles.loadingLineSecondary} />
        </View>
      </View>
      <View style={homeStyles.loadingBlock} />
      <View style={homeStyles.loadingLineTertiary} />
      <View style={homeStyles.loadingLineSecondary} />
    </Animated.View>
  );
}

export default function HomeScreen() {
  const uploadSuccessAlertLock = useRef(false);
  const diskCacheLoadedRef = useRef(false);
  const loadMoreTriggerLock = useRef(false);
  const lastContentHeightRef = useRef(0);
  const lastTriggeredContentHeightRef = useRef(0);
  const [posts, setPosts] = useState(homeFeedCache);
  const [isLoading, setIsLoading] = useState(homeFeedCache.length === 0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasLoadedAllPosts, setHasLoadedAllPosts] = useState(false);
  const [lastId, setLastId] = useState("");
  const [newItemsCount, setNewItemsCount] = useState(0);
  const [uploadingCards, setUploadingCards] = useState([]);
  const { isNoInternet, executeWithInternetCheck } = useInternetFetch();

  const mergeUniquePosts = useCallback((currentPosts, incomingPosts) => {
    if (!Array.isArray(incomingPosts) || incomingPosts.length === 0) {
      return currentPosts;
    }

    const seenIds = new Set(currentPosts.map((item) => item.id));
    const uniqueIncomingPosts = incomingPosts.filter(
      (item) => item?.id && !seenIds.has(item.id),
    );

    return uniqueIncomingPosts.length
      ? [...currentPosts, ...uniqueIncomingPosts]
      : currentPosts;
  }, []);

  const mergeRefreshedFeed = useCallback((currentPosts, firstPagePosts) => {
    if (!Array.isArray(firstPagePosts) || firstPagePosts.length === 0) {
      return currentPosts;
    }

    const firstPageIds = new Set(firstPagePosts.map((item) => item?.id));
    const remainingPosts = currentPosts.filter(
      (item) => item?.id && !firstPageIds.has(item.id),
    );

    return [...firstPagePosts, ...remainingPosts];
  }, []);

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
        const result = await getFeedPage({
          index: 0,
          count: FEED_PAGE_SIZE,
          lastId: "",
        });
        const nextItems = result.items || [];
        const hadCachedPosts = homeFeedCache.length > 0;
        const mergedFeed =
          !refresh && hadCachedPosts
            ? mergeRefreshedFeed(homeFeedCache, nextItems)
            : nextItems;

        if (!refresh && nextItems.length === 0 && hadCachedPosts) {
          setPosts(homeFeedCache);
        } else {
          homeFeedCache = mergedFeed;
          setPosts(mergedFeed);
          writeCache(CACHE_KEY_HOME_FEED, mergedFeed);
        }

        const loadedCount =
          !refresh && nextItems.length === 0 && hadCachedPosts
            ? homeFeedCache.length
            : mergedFeed.length;

        setCurrentPage(
          Math.max(0, Math.ceil(loadedCount / FEED_PAGE_SIZE) - 1),
        );
        if (refresh || !hadCachedPosts) {
          setHasLoadedAllPosts(
            Boolean(result.hasMore) === false && nextItems.length > 0,
          );
        }
        loadMoreTriggerLock.current = false;
        lastTriggeredContentHeightRef.current = 0;
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
    if (isLoadingMore || hasLoadedAllPosts || posts.length === 0) return;

    try {
      setIsLoadingMore(true);
      await wait(LOAD_MORE_CARD_DELAY_MS);
      const nextPage = currentPage + 1;
      let result = await getFeedPage({
        index: nextPage,
        count: FEED_PAGE_SIZE,
        lastId,
      });

      let nextItems = result.items || [];
      if (nextItems.length === 0 && posts.length >= FEED_PAGE_SIZE) {
        result = await getFeedPage({
          index: posts.length,
          count: FEED_PAGE_SIZE,
          lastId,
        });
        nextItems = result.items || [];
      }

      if (nextItems.length === 0) {
        setHasLoadedAllPosts(true);
        Alert.alert("Thông báo", "Đã load hết tất cả các post");
        return;
      }

      setPosts((current) => {
        const next = mergeUniquePosts(current, nextItems);
        homeFeedCache = next;
        writeCache(CACHE_KEY_HOME_FEED, next);
        return next;
      });
      setCurrentPage(nextPage);
      setLastId(result.lastId || "");
    } catch (error) {
      console.warn("Failed to load more posts:", error);
      if (await redirectIfSessionExpired(error, router)) return;
    } finally {
      loadMoreTriggerLock.current = false;
      setIsLoadingMore(false);
    }
  }, [
    currentPage,
    hasLoadedAllPosts,
    isLoadingMore,
    lastId,
    mergeUniquePosts,
    posts.length,
  ]);

  const queueLoadMore = useCallback(
    (contentHeight = 0) => {
      if (
        loadMoreTriggerLock.current ||
        isLoadingMore ||
        hasLoadedAllPosts ||
        posts.length === 0
      ) {
        return;
      }

      if (
        contentHeight > 0 &&
        contentHeight <= lastTriggeredContentHeightRef.current
      ) {
        return;
      }

      lastTriggeredContentHeightRef.current = contentHeight;
      loadMoreTriggerLock.current = true;
      void loadMore();
    },
    [hasLoadedAllPosts, isLoadingMore, loadMore, posts.length],
  );

  const handleListScroll = useCallback(
    ({ nativeEvent }) => {
      if (loadMoreTriggerLock.current || isLoadingMore || hasLoadedAllPosts) {
        return;
      }

      const visibleHeight = nativeEvent.layoutMeasurement?.height || 0;
      const offsetY = nativeEvent.contentOffset?.y || 0;
      const contentHeight = nativeEvent.contentSize?.height || 0;
      const distanceToBottom = contentHeight - (visibleHeight + offsetY);

      lastContentHeightRef.current = contentHeight;

      if (distanceToBottom <= 140 && contentHeight > visibleHeight) {
        queueLoadMore(contentHeight);
      }
    },
    [hasLoadedAllPosts, isLoadingMore, queueLoadMore],
  );

  const handleEndReached = useCallback(() => {
    queueLoadMore(lastContentHeightRef.current);
  }, [queueLoadMore]);

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
          onScroll={handleListScroll}
          scrollEventThrottle={16}
          onContentSizeChange={(_, height) => {
            lastContentHeightRef.current = height;
          }}
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
              <FeedLoadingCard />
            ) : hasLoadedAllPosts && posts.length > 0 ? (
              <Text style={homeStyles.subtitle}>
                Đã load hết tất cả các post
              </Text>
            ) : posts.length > 0 ? (
              <Text style={homeStyles.subtitle}>Kéo xuống để tải thêm</Text>
            ) : null
          }
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.15}
        />
      )}
    </View>
  );
}
