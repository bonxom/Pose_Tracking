import AppButton from "@/components/common/AppButton";
import PostCard from "@/components/post/PostCard";
import {
  getUserFriends,
  getUserInfo,
  getUserPosts,
} from "@/repositories/userRepository";
import profileStyles from "@/styles/profile.styles";
import { clearAuthSession, getAuthSession } from "@/utils/session";
import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  Text,
  View,
} from "react-native";

const PROFILE_TABS = ["Bài viết", "Giới thiệu", "Bạn bè", "Ảnh", "Reels"];

function initials(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "U";
}

function Avatar({ uri, name, size = 72, bordered = false }) {
  const avatarStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  return (
    <View style={[bordered && profileStyles.fbAvatarBorder, avatarStyle]}>
      {uri ? (
        <Image
          source={{ uri }}
          style={[profileStyles.avatarImage, avatarStyle]}
          onError={(event) =>
            console.warn("PROFILE_AVATAR_LOAD_ERROR", uri, event.nativeEvent?.error)
          }
        />
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

function FbButton({ title, icon, variant = "primary", onPress, disabled, compact }) {
  const isIconOnly = variant === "icon";
  const iconSize = isIconOnly ? 22 : icon === "pencil" ? 17 : 18;
  const iconColor = variant === "primary" ? "#FFFFFF" : "#050505";

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        profileStyles.fbButton,
        compact && profileStyles.fbButtonCompact,
        variant === "secondary" && profileStyles.fbButtonSecondary,
        variant === "icon" && profileStyles.fbIconButton,
        disabled && profileStyles.pillButtonDisabled,
        pressed && !disabled && profileStyles.pillButtonPressed,
      ]}
    >
      {icon ? (
        <View
          style={[
            profileStyles.fbButtonIconSlot,
            isIconOnly && profileStyles.fbIconButtonSlot,
          ]}
        >
          <Ionicons name={icon} size={iconSize} color={iconColor} />
        </View>
      ) : null}
      {!isIconOnly ? (
        <Text
          style={[
            profileStyles.fbButtonText,
            variant !== "primary" && profileStyles.fbButtonTextDark,
          ]}
          numberOfLines={1}
        >
          {title}
        </Text>
      ) : null}
    </Pressable>
  );
}

function EmptyState({ icon, title, body }) {
  return (
    <View style={profileStyles.emptyState}>
      <Ionicons name={icon} size={30} color="#65676B" />
      <Text style={profileStyles.emptyTitle}>{title}</Text>
      {body ? <Text style={profileStyles.emptyBody}>{body}</Text> : null}
    </View>
  );
}

function ProfileMenu({ visible, onClose, onEdit, onSearch, onCopyLink }) {
  const rows = [
    { label: "Chỉnh sửa trang cá nhân", icon: "create-outline", onPress: onEdit },
    { label: "Tìm kiếm trên trang cá nhân", icon: "search-outline", onPress: onSearch },
    { label: "Sao chép liên kết trang cá nhân", icon: "link-outline", onPress: onCopyLink },
  ];

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={profileStyles.modalRoot}>
        <Pressable style={profileStyles.backdrop} onPress={onClose} />
        <View style={profileStyles.menuSheet}>
          <View style={profileStyles.sheetHandle} />
          {rows.map((row) => (
            <Pressable
              key={row.label}
              style={profileStyles.menuRow}
              onPress={() => {
                onClose();
                row.onPress?.();
              }}
            >
              <View style={profileStyles.menuIcon}>
                <Ionicons name={row.icon} size={21} color="#050505" />
              </View>
              <Text style={profileStyles.menuText}>{row.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </Modal>
  );
}

function MiniFriendStack({ friends }) {
  const preview = friends.slice(0, 5);
  if (!preview.length) return null;

  return (
    <View style={profileStyles.fbMiniFriendStack}>
      {preview.map((friend, index) => (
        <View
          key={friend.id}
          style={[profileStyles.fbMiniFriend, { marginLeft: index === 0 ? 0 : -8 }]}
        >
          <Avatar uri={friend.avatar} name={friend.displayName} size={30} />
        </View>
      ))}
    </View>
  );
}

function ProfileHero({
  profile,
  friends,
  isOwnProfile,
  onOpenMenu,
  onEdit,
  onAddFriend,
  onMessage,
}) {
  const description = profile.description || "Chưa có mô tả";

  return (
    <View style={profileStyles.fbHero}>
      <View style={profileStyles.fbCover}>
        {profile.coverImage ? (
          <Image source={{ uri: profile.coverImage }} style={profileStyles.coverImage} />
        ) : (
          <View style={profileStyles.fbCoverFallback}>
            <Ionicons name="image-outline" size={38} color="#8A8D91" />
          </View>
        )}
        {isOwnProfile ? (
          <Pressable style={profileStyles.fbCoverCamera} onPress={onEdit}>
            <Ionicons name="camera" size={18} color="#050505" />
          </Pressable>
        ) : null}
      </View>

      <View style={profileStyles.fbHeroInfo}>
        <View style={profileStyles.fbAvatarRow}>
          <View>
            <Avatar uri={profile.avatar} name={profile.displayName} size={132} bordered />
            {isOwnProfile ? (
              <Pressable style={profileStyles.fbAvatarCamera} onPress={onEdit}>
                <Ionicons name="camera" size={19} color="#050505" />
              </Pressable>
            ) : null}
          </View>
        </View>

        <Text style={profileStyles.fbName}>{profile.displayName || profile.username}</Text>
        <View style={profileStyles.fbFriendLine}>
          <Text style={profileStyles.fbFriendCount}>{profile.friendCount || friends.length} người bạn</Text>
          <MiniFriendStack friends={friends} />
        </View>
        <Text style={profileStyles.fbBio} numberOfLines={3}>
          {description}
        </Text>

        <View style={profileStyles.fbActionRow}>
          {isOwnProfile ? (
            <>
              <FbButton title="Thêm vào tin" icon="add" onPress={onEdit} />
              <FbButton
                title="Chỉnh sửa trang cá nhân"
                icon="pencil"
                variant="secondary"
                onPress={onEdit}
              />
            </>
          ) : profile.relationStatus === "sent" ? (
            <FbButton title="Đã gửi yêu cầu" icon="time-outline" variant="secondary" disabled />
          ) : profile.relationStatus === "received" ? (
            <>
              <FbButton title="Trả lời" icon="person-add" onPress={onAddFriend} />
              <FbButton title="Nhắn tin" icon="chatbubble" variant="secondary" onPress={onMessage} />
            </>
          ) : (
            <>
              <FbButton title="Thêm bạn bè" icon="person-add" onPress={onAddFriend} />
              <FbButton title="Nhắn tin" icon="chatbubble" variant="secondary" onPress={onMessage} />
            </>
          )}
          <FbButton icon="ellipsis-horizontal" variant="icon" onPress={onOpenMenu} compact />
        </View>
      </View>
    </View>
  );
}

function ProfileTabs({ activeTab, onChangeTab }) {
  return (
    <View style={profileStyles.fbTabs}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={profileStyles.fbTabsContent}
      >
        {PROFILE_TABS.map((tab) => (
          <Pressable
            key={tab}
            style={[profileStyles.fbTab, activeTab === tab && profileStyles.fbTabActive]}
            onPress={() => onChangeTab(tab)}
          >
            <Text
              style={[
                profileStyles.fbTabText,
                activeTab === tab && profileStyles.fbTabTextActive,
              ]}
            >
              {tab}
            </Text>
          </Pressable>
        ))}
        <Pressable style={profileStyles.fbTabMore} onPress={() => onChangeTab("Giới thiệu")}>
          <Ionicons name="ellipsis-horizontal" size={20} color="#050505" />
        </Pressable>
      </ScrollView>
    </View>
  );
}

function IntroRow({ icon, text, link }) {
  if (!text) return null;

  return (
    <Pressable
      disabled={!link}
      onPress={() => link && Linking.openURL(link)}
      style={profileStyles.fbIntroRow}
    >
      <Ionicons name={icon} size={22} color="#65676B" />
      <Text style={[profileStyles.fbIntroText, link && profileStyles.fbIntroLink]} numberOfLines={2}>
        {text}
      </Text>
    </Pressable>
  );
}

function IntroCard({ profile, onEdit }) {
  const location = [profile.address || profile.city, profile.country].filter(Boolean).join(", ");

  return (
    <View style={profileStyles.fbCard}>
      <Text style={profileStyles.fbCardTitle}>Giới thiệu</Text>
      <Text style={profileStyles.fbIntroBio}>{profile.description || "Chưa có mô tả"}</Text>
      <IntroRow icon="person-circle-outline" text={`Tên người dùng: ${profile.username}`} />
      <IntroRow icon="people-outline" text={`${profile.friendCount || 0} người bạn`} />
      <IntroRow icon="location-outline" text={location} />
      <IntroRow icon="link-outline" text={profile.profileLink} link={profile.profileLink} />
      <IntroRow icon="radio-button-on-outline" text={profile.online ? "Đang hoạt động" : "Không hiển thị trạng thái hoạt động"} />
      {profile.isOwnProfile ? (
        <Pressable style={profileStyles.fbWideGrayButton} onPress={onEdit}>
          <Text style={profileStyles.fbWideGrayButtonText}>Chỉnh sửa chi tiết công khai</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function AboutDetail({ profile, onEdit }) {
  const categories = [
    "Giới thiệu",
    "Thông tin cá nhân",
    "Công việc",
    "Trình độ học vấn",
    "Sở thích",
    "Mối quan tâm",
    "Liên kết",
  ];

  return (
    <View style={profileStyles.fbCard}>
      <Text style={profileStyles.fbCardTitle}>Giới thiệu</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={profileStyles.fbAboutPills}
      >
        {categories.map((item, index) => (
          <View key={item} style={[profileStyles.fbAboutPill, index === 0 && profileStyles.fbAboutPillActive]}>
            <Text
              style={[
                profileStyles.fbAboutPillText,
                index === 0 && profileStyles.fbAboutPillTextActive,
              ]}
            >
              {item}
            </Text>
          </View>
        ))}
      </ScrollView>

      <Text style={profileStyles.fbSubheading}>Tiểu sử</Text>
      <View style={profileStyles.fbBioLine}>
        <Ionicons name="hand-left-outline" size={23} color="#050505" />
        <Text style={profileStyles.fbIntroText}>{profile.description || "Chưa có mô tả"}</Text>
        {profile.isOwnProfile ? (
          <Pressable onPress={onEdit}>
            <Ionicons name="pencil-outline" size={22} color="#65676B" />
          </Pressable>
        ) : null}
      </View>

      <Text style={profileStyles.fbSubheading}>Chi tiết đã ghim</Text>
      <IntroRow icon="pin-outline" text={profile.profileLink || profile.address || "Chi tiết đã ghim"} />
    </View>
  );
}

function FriendsCard({ friends, total, userId, full = false }) {
  const items = full ? friends : friends.slice(0, 6);

  return (
    <View style={profileStyles.fbCard}>
      <View style={profileStyles.fbCardHeader}>
        <View>
          <Text style={profileStyles.fbCardTitle}>Bạn bè</Text>
          <Text style={profileStyles.fbCardSubtitle}>{total || friends.length} người bạn</Text>
        </View>
        <Pressable
          onPress={() =>
            router.push({
              pathname: "/(tabs)/friends",
              params: { userId: userId || "", source: "profile" },
            })
          }
        >
          <Text style={profileStyles.fbBlueText}>Xem tất cả</Text>
        </Pressable>
      </View>

      {items.length ? (
        <View style={profileStyles.fbFriendGrid}>
          {items.map((friend) => (
            <Pressable
              key={friend.id}
              style={profileStyles.fbFriendTile}
              onPress={() => router.push(`/profile/${friend.id}`)}
            >
              <Avatar uri={friend.avatar} name={friend.displayName} size={96} />
              <Text style={profileStyles.fbFriendName} numberOfLines={2}>
                {friend.displayName}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : (
        <EmptyState icon="people-outline" title="Chưa có bạn bè" body="Danh sách bạn bè sẽ hiển thị tại đây." />
      )}
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
      <View style={profileStyles.fbComposerActions}>
        <View style={profileStyles.fbComposerAction}>
          <Ionicons name="videocam" size={20} color="#F3425F" />
          <Text style={profileStyles.fbComposerActionText}>Trực tiếp</Text>
        </View>
        <View style={profileStyles.fbComposerAction}>
          <Ionicons name="images" size={20} color="#45BD62" />
          <Text style={profileStyles.fbComposerActionText}>Ảnh</Text>
        </View>
        <View style={profileStyles.fbComposerAction}>
          <Ionicons name="flag" size={20} color="#F7B928" />
          <Text style={profileStyles.fbComposerActionText}>Sự kiện</Text>
        </View>
      </View>
    </View>
  );
}

function PostsSection({ profile, posts, loading }) {
  return (
    <>
      {profile.isOwnProfile ? <ComposerCard profile={profile} /> : null}
      <View style={profileStyles.fbCard}>
        <View style={profileStyles.fbCardHeader}>
          <Text style={profileStyles.fbCardTitle}>Bài viết</Text>
          <Pressable style={profileStyles.fbSmallGrayButton}>
            <Ionicons name="filter" size={16} color="#050505" />
            <Text style={profileStyles.fbSmallGrayButtonText}>Bộ lọc</Text>
          </Pressable>
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

function MediaCard({ title, icon }) {
  return (
    <View style={profileStyles.fbCard}>
      <Text style={profileStyles.fbCardTitle}>{title}</Text>
      <EmptyState icon={icon} title={`Chưa có ${title.toLowerCase()}`} body="Nội dung sẽ hiển thị khi API trả dữ liệu." />
    </View>
  );
}

function ProfileBody({ tab, profile, friends, posts, loading, onEdit }) {
  if (tab === "Giới thiệu") {
    return <AboutDetail profile={profile} onEdit={onEdit} />;
  }

  if (tab === "Bạn bè") {
    return <FriendsCard friends={friends} total={profile.friendCount} userId={profile.id} full />;
  }

  if (tab === "Ảnh") {
    return <MediaCard title="Ảnh" icon="images-outline" />;
  }

  if (tab === "Reels") {
    return <MediaCard title="Reels" icon="film-outline" />;
  }

  return (
    <>
      <IntroCard profile={profile} onEdit={onEdit} />
      <FriendsCard friends={friends} total={profile.friendCount} userId={profile.id} />
      <PostsSection profile={profile} posts={posts} loading={loading} />
    </>
  );
}

export default function ProfileScreenContent({ userId = "" }) {
  const [profile, setProfile] = useState(null);
  const [friends, setFriends] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [menuVisible, setMenuVisible] = useState(false);
  const [activeTab, setActiveTab] = useState("Bài viết");

  const loadProfile = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError("");

    try {
      const session = await getAuthSession();
      const targetUserId = userId || "";
      const user = await getUserInfo(targetUserId);
      const isOwnProfile = Boolean(
        user.isOwnProfile ||
          !targetUserId ||
          String(targetUserId) === String(session?.id || session?.user_id || session?.identifier || ""),
      );

      if (user.unavailable) {
        setProfile(user);
        setFriends([]);
        setPosts([]);
        return;
      }

      const [friendList, postPage] = await Promise.all([
        getUserFriends(user.id),
        getUserPosts(user.id, { index: 0, count: 20, includeLocked: isOwnProfile }),
      ]);

      setProfile({ ...user, isOwnProfile, friendCount: user.friendCount || friendList.length });
      setFriends(friendList);
      setPosts(postPage.items || []);
    } catch (loadError) {
      if (loadError.sessionExpired) {
        await clearAuthSession();
        router.replace("/(auth)/login");
        return;
      }
      setError(loadError.message || "Không thể tải hồ sơ.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      loadProfile(false);
    }, [loadProfile]),
  );

  const profileLink = useMemo(() => {
    const id = profile?.id || userId || "";
    return Linking.createURL(id ? `/profile/${id}` : "/(tabs)/profile");
  }, [profile?.id, userId]);

  const handleCopyLink = async () => {
    try {
      await Share.share({ message: profileLink, url: profileLink });
    } catch {
      Alert.alert("Liên kết trang cá nhân", profileLink);
    }
  };

  const handleAddFriend = () => {
    Alert.alert("Thông báo", "API kết bạn chưa có trong project. Nút đã sẵn sàng để nối API thật.");
  };

  if (loading && !profile) {
    return (
      <View style={profileStyles.centerState}>
        <ActivityIndicator size="large" color="#0866FF" />
        <Text style={profileStyles.centerText}>Đang tải hồ sơ...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={profileStyles.centerState}>
        <Ionicons name="alert-circle-outline" size={42} color="#DC2626" />
        <Text style={profileStyles.centerTitle}>Không thể tải hồ sơ</Text>
        <Text style={profileStyles.centerText}>{error}</Text>
        <AppButton title="Thử lại" onPress={() => loadProfile(false)} style={profileStyles.retryButton} />
      </View>
    );
  }

  if (!profile || profile.unavailable) {
    return (
      <View style={profileStyles.centerState}>
        <Ionicons name="person-circle-outline" size={48} color="#65676B" />
        <Text style={profileStyles.centerTitle}>Tài khoản không tồn tại</Text>
        <Text style={profileStyles.centerText}>
          {profile?.unavailableReason || "Hồ sơ này không khả dụng hoặc bạn không có quyền xem."}
        </Text>
      </View>
    );
  }

  return (
    <View style={profileStyles.screen}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadProfile(true)} tintColor="#0866FF" />
        }
        contentContainerStyle={profileStyles.scrollContent}
      >
        <ProfileHero
          profile={profile}
          friends={friends}
          isOwnProfile={profile.isOwnProfile}
          onOpenMenu={() =>
            profile.isOwnProfile
              ? router.push("/profile/settings")
              : setMenuVisible(true)
          }
          onEdit={() => router.push("/settings/profile-edit")}
          onAddFriend={handleAddFriend}
          onMessage={() => router.push("/chat")}
        />

        <ProfileTabs activeTab={activeTab} onChangeTab={setActiveTab} />

        <View style={profileStyles.fbBody}>
          <ProfileBody
            tab={activeTab}
            profile={profile}
            friends={friends}
            posts={posts}
            loading={loading}
            onEdit={() => router.push("/settings/profile-edit")}
          />
        </View>
      </ScrollView>

      <ProfileMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onEdit={() => router.push("/settings/profile-edit")}
        onSearch={() =>
          router.push({
            pathname: "/profile/search",
            params: { userId: profile.id },
          })
        }
        onCopyLink={handleCopyLink}
      />
    </View>
  );
}
