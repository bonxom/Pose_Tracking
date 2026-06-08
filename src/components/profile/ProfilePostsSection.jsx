import UserAvatar from "@/components/common/UserAvatar";
import ProfileIcon from "@/components/icons/ProfileIcon";
import PostCard from "@/components/post/PostCard";
import colors from "@/constants/colors";
import profileStyles from "@/styles/profile.styles";
import { router } from "expo-router";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

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

export default function ProfilePostsSection({ profile, posts, loading }) {
  return (
    <>
      {profile.isOwnProfile ? <ComposerCard profile={profile} /> : null}
      <View style={profileStyles.fbCard}>
        <View style={profileStyles.fbCardHeader}>
          <Text style={profileStyles.fbCardTitle}>Bài viết</Text>
        </View>

        {loading ? (
          <ActivityIndicator style={profileStyles.inlineLoader} />
        ) : posts.length ? (
          <View style={profileStyles.postList}>
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onPress={() => router.push(`/post/${post.id}`)}
                onPressComment={() => router.push(`/post/comment/${post.id}`)}
              />
            ))}
          </View>
        ) : (
          <EmptyState
            icon="newspaper-outline"
            title="Chưa có bài viết"
            body="Bài viết và video cá nhân sẽ hiển thị ở đây."
          />
        )}
      </View>
    </>
  );
}
