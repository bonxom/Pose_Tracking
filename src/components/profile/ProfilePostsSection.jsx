import UserAvatar from "@/components/common/UserAvatar";
import ProfileIcon from "@/components/icons/ProfileIcon";
import PostCard from "@/components/post/PostCard";
import PostUploadingCard from "@/components/post/PostUploadingCard";
import colors from "@/constants/colors";
import profileStyles from "@/styles/profile.styles";
import homeStyles from "@/styles/home.styles";
import { router } from "expo-router";
import { useMemo, useEffect, useRef } from "react";
import { FlatList, Pressable, RefreshControl, Text, View, Animated } from "react-native";

function EmptyState({ icon, title, body }) {
  return (
    <View style={profileStyles.emptyState}>
      <ProfileIcon name={icon} size={30} color={colors.inkMuted} />
      <Text style={profileStyles.emptyTitle}>{title}</Text>
      {body ? <Text style={profileStyles.emptyBody}>{body}</Text> : null}
    </View>
  );
}

function ComposerCard({ profile }) {
  return (
    <View style={profileStyles.fbCard}>
      <View style={profileStyles.fbComposerRow}>
        <UserAvatar uri={profile.avatar} size={42} />
        <Pressable
          style={profileStyles.fbComposerInput}
          onPress={() => router.push("/post/create")}
        >
          <Text style={profileStyles.fbComposerText}>Bạn đang nghĩ gì?</Text>
        </Pressable>
      </View>
    </View>
  );
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

export default function ProfilePostsSection({
  profile,
  posts,
  loading,
  uploadingCards = [],
  isRefreshing,
  isLoadingMore,
  hasLoadedAllPosts,
  onRefresh,
  onScroll,
  onContentSizeChange,
  onEndReached,
  onToggleLike,
  onSubmitExercise,
  onDeletePost,
  headerComponent,
}) {
  const feedItems = useMemo(() => {
    const uploadingItems = profile?.isOwnProfile
      ? uploadingCards.map((item) => ({
          id: item.id,
          __uploading: true,
          avatarUri: item.avatarUri,
        }))
      : [];

    return [...uploadingItems, ...posts];
  }, [posts, uploadingCards, profile?.isOwnProfile]);

  const ListHeader = useMemo(() => (
    <View style={{ gap: 8 }}>
      {headerComponent}
      <View style={profileStyles.fbBody}>
        {profile?.isOwnProfile ? <ComposerCard profile={profile} /> : null}
        <View style={{ backgroundColor: colors.white, paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <Text style={profileStyles.fbCardTitle}>Bài viết</Text>
        </View>
      </View>
    </View>
  ), [profile, headerComponent]);

  return (
    <FlatList
      data={feedItems}
      keyExtractor={(item) => item.id}
      onScroll={onScroll}
      scrollEventThrottle={16}
      onContentSizeChange={onContentSizeChange}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor={colors.brand}
        />
      }
      ListHeaderComponent={ListHeader}
      renderItem={({ item }) =>
        item.__uploading ? (
          <PostUploadingCard avatarUri={item.avatarUri} />
        ) : (
          <PostCard
            post={item}
            flat
            onPress={() => router.push(`/post/${item.id}`)}
            onToggleLike={() => onToggleLike?.(item)}
            onPressComment={() => router.push(`/post/comment/${item.id}`)}
            onSubmitExercise={() => onSubmitExercise?.(item)}
            onDeletePost={(deletedPostId) =>
              onDeletePost?.(deletedPostId || item.id)
            }
          />
        )
      }
      ItemSeparatorComponent={() => <View style={homeStyles.postDivider} />}
      ListEmptyComponent={
        !loading && (
          <View style={{ paddingHorizontal: 16, paddingVertical: 16, backgroundColor: colors.white }}>
            <EmptyState
              icon="newspaper-outline"
              title="Chưa có bài viết"
              body="Bài viết và video cá nhân sẽ hiển thị ở đây."
            />
          </View>
        )
      }
      ListFooterComponent={
        isLoadingMore ? (
          <FeedLoadingCard />
        ) : hasLoadedAllPosts && posts.length > 0 ? (
          <Text
            style={[
              homeStyles.subtitle,
              { textAlign: "center", paddingBottom: 24, paddingTop: 16 },
            ]}
          >
            Đã load hết tất cả các post
          </Text>
        ) : posts.length > 0 ? (
          <Text
            style={[
              homeStyles.subtitle,
              { textAlign: "center", paddingBottom: 24, paddingTop: 16 },
            ]}
          >
            Kéo xuống để tải thêm
          </Text>
        ) : null
      }
      onEndReached={onEndReached}
      onEndReachedThreshold={0.15}
    />
  );
}
