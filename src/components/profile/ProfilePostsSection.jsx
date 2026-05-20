import ProfileIcon from "@/components/icons/ProfileIcon";
import PostCard from "@/components/post/PostCard";
import colors from "@/constants/colors";
import profileStyles from "@/styles/profile.styles";
import { initials } from "@/utils/profile";
import { router } from "expo-router";
import { ActivityIndicator, Image, Pressable, Text, View } from "react-native";

function Avatar({ uri, name, size = 72 }) {
  const avatarStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  return (
    <View style={avatarStyle}>
      {uri ? (
        <Image source={{ uri }} style={[profileStyles.avatarImage, avatarStyle]} />
      ) : (
        <View style={[profileStyles.avatarFallback, avatarStyle]}>
          <Text
            style={[
              profileStyles.avatarFallbackText,
              { fontSize: Math.max(14, size * 0.34) },
            ]}
          >
            {initials(name)}
          </Text>
        </View>
      )}
    </View>
  );
}

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
        <Avatar uri={profile.avatar} name={profile.displayName} size={42} />
        <Pressable style={profileStyles.fbComposerInput} onPress={() => router.push("/post/create")}>
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
                onPressComment={() => router.push(`/comment/${post.id}`)}
              />
            ))}
          </View>
        ) : (
          <EmptyState icon="newspaper-outline" title="Chưa có bài viết" body="Bài viết và video cá nhân sẽ hiển thị ở đây." />
        )}
      </View>
    </>
  );
}