import BackIcon from "@/components/icons/BackIcon";
import ProfileIcon from "@/components/icons/ProfileIcon";
import PostCard from "@/components/post/PostCard";
import colors from "@/constants/colors";
import searchStyles from "@/styles/search.styles";
import { resolveAvatarUri } from "@/utils/profile";
import { memo } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { Image } from "expo-image";

const SearchTabButton = memo(function SearchTabButton({
  label,
  active,
  onPress,
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[searchStyles.tabButton, active && searchStyles.tabButtonActive]}
    >
      <Text style={[searchStyles.tabText, active && searchStyles.tabTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
});

const SearchHistoryRow = memo(function SearchHistoryRow({
  item,
  active,
  onPress,
  onOpenMenu,
}) {
  return (
    <View style={searchStyles.historyRow}>
      <Pressable style={searchStyles.historyMain} onPress={onPress}>
        <View style={searchStyles.historyIconWrap}>
          <ProfileIcon name="time-outline" size={16} color={colors.ink} />
        </View>
        <View style={searchStyles.historyBody}>
          <Text style={searchStyles.historyTitle} numberOfLines={1}>
            {item.keyword}
          </Text>
        </View>
      </Pressable>
      <Pressable
        onPress={onOpenMenu}
        hitSlop={8}
        style={[
          searchStyles.historyMenuButton,
          active && searchStyles.historyMenuButtonActive,
        ]}
      >
        <ProfileIcon
          name="ellipsis-horizontal"
          size={20}
          color={active ? colors.brand : colors.inkSoft}
        />
      </Pressable>
    </View>
  );
});

export const SearchSkeletonRow = memo(function SearchSkeletonRow({
  avatar = true,
  subtitle = true,
  compact = false,
}) {
  return (
    <View
      style={[searchStyles.skeletonRow, compact && searchStyles.skeletonRowCompact]}
    >
      {avatar ? <View style={searchStyles.skeletonAvatar} /> : null}
      <View style={searchStyles.skeletonBody}>
        <View style={[searchStyles.skeletonLine, searchStyles.skeletonLinePrimary]} />
        {subtitle ? (
          <View style={[searchStyles.skeletonLine, searchStyles.skeletonLineSecondary]} />
        ) : null}
      </View>
    </View>
  );
});

export const SearchSuggestionRow = memo(function SearchSuggestionRow({
  label,
  icon,
  onPress,
}) {
  return (
    <Pressable style={searchStyles.suggestionRow} onPress={onPress}>
      <View style={searchStyles.suggestionIconWrap}>
        <ProfileIcon name={icon} size={16} color={colors.ink} />
      </View>
      <Text style={searchStyles.suggestionText} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
});

export const SearchUserCard = memo(function SearchUserCard({ user, onPress }) {
  const subtitle = user.description || "";
  const avatarUri = resolveAvatarUri(
    user.avatar || "",
    user.avatarVersion || user.profileSyncRequestedAt || "",
  );

  return (
    <Pressable style={searchStyles.userCard} onPress={onPress}>
      <Image
        source={{ uri: avatarUri }}
        style={searchStyles.userAvatar}
        contentFit="cover"
        cachePolicy="memory-disk"
        transition={150}
      />
      <View style={searchStyles.userInfo}>
        <Text style={searchStyles.userName} numberOfLines={1}>
          {user.name}
        </Text>
        <Text style={searchStyles.userMeta} numberOfLines={1}>
          {user.handle ? `@${user.handle.replace(/^@/, "")}` : user.role}
          {user.handle ? ` · ${user.role}` : ""}
        </Text>
        <Text style={searchStyles.userDescription} numberOfLines={2}>
          {subtitle}
        </Text>
      </View>
      <ProfileIcon name="chevron-forward" size={18} color={colors.subtext} />
    </Pressable>
  );
});

export const SearchPostRow = memo(function SearchPostRow({
  item,
  onPressPost,
  onToggleLike,
  onPressComment,
}) {
  return (
    <PostCard
      post={item}
      onPress={() => onPressPost(item)}
      onToggleLike={() => onToggleLike(item)}
      onPressComment={() => onPressComment(item)}
    />
  );
});

export function SearchHeader({
  keyword,
  activeTab,
  hasSearched,
  error,
  loadingSearch,
  loadingHistory,
  suggestions,
  users,
  savedSearches,
  activeHistoryItem,
  onBack,
  onChangeKeyword,
  onFocusInput,
  onSubmitSearch,
  onClearKeyword,
  onSelectSuggestion,
  onSelectHistory,
  onOpenHistoryMenu,
  onClearAllHistory,
  onChangeTab,
  onPressUser,
  searchTabs,
  showPeopleResults = false,
}) {
  const showSuggestions = Boolean(keyword.trim()) && !hasSearched;
  const showHistory = !keyword.trim() && !hasSearched;
  const tabs = searchTabs || [];

  return (
    <View style={searchStyles.headerShell}>
      <View style={searchStyles.headerBar}>
        <Pressable onPress={onBack} style={searchStyles.backButton}>
          <BackIcon size={22} color={colors.text} />
        </Pressable>
        <View style={searchStyles.searchInputWrap}>
          <ProfileIcon name="search-outline" size={18} color={colors.subtext} />
          <TextInput
            value={keyword}
            onChangeText={onChangeKeyword}
            placeholder="Tìm kiếm"
            placeholderTextColor={colors.placeholder}
            style={searchStyles.searchInput}
            returnKeyType="search"
            onSubmitEditing={onSubmitSearch}
            onFocus={onFocusInput}
            autoFocus
          />
          {keyword ? (
            <Pressable style={searchStyles.clearButton} onPress={onClearKeyword}>
              <ProfileIcon name="close" size={18} color={colors.subtext} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {error ? <Text style={searchStyles.errorText}>{error}</Text> : null}

      {showSuggestions ? (
        <View style={searchStyles.panel}>
          {loadingSearch ? (
            <View style={searchStyles.suggestionLoadingRow}>
              <ActivityIndicator size="small" color={colors.brand} />
            </View>
          ) : null}
          {suggestions.length ? (
            suggestions.map((item) => (
              <SearchSuggestionRow
                key={item}
                label={item}
                icon="search-outline"
                onPress={() => onSelectSuggestion(item)}
              />
            ))
          ) : (
            <Text style={searchStyles.emptyInlineText}>
              Chưa có gợi ý phù hợp.
            </Text>
          )}
        </View>
      ) : null}

      {showHistory ? (
        <View style={searchStyles.panel}>
          <View style={searchStyles.panelHeader}>
            <Text style={searchStyles.panelTitle}>Mới đây</Text>
            {savedSearches.length ? (
              <Pressable onPress={onClearAllHistory}>
                <Text style={searchStyles.headerLink}>Xóa tất cả</Text>
              </Pressable>
            ) : null}
          </View>

          {loadingHistory ? (
            <View style={searchStyles.skeletonGroup}>
              <SearchSkeletonRow />
              <SearchSkeletonRow />
              <SearchSkeletonRow subtitle={false} />
            </View>
          ) : savedSearches.length ? (
            savedSearches.map((item) => (
              <SearchHistoryRow
                key={item.id}
                item={item}
                active={activeHistoryItem?.id === item.id}
                onPress={() => onSelectHistory(item.keyword)}
                onOpenMenu={() => onOpenHistoryMenu(item)}
              />
            ))
          ) : (
            <Text style={searchStyles.emptyInlineText}>
              Chưa có lịch sử tìm kiếm.
            </Text>
          )}
        </View>
      ) : null}

      {hasSearched ? (
        <View style={searchStyles.tabRow}>
          {tabs.map((tab) => (
            <SearchTabButton
              key={tab.id}
              label={tab.label}
              active={activeTab === tab.id}
              onPress={() => onChangeTab(tab.id)}
            />
          ))}
        </View>
      ) : null}

      {showPeopleResults && users?.length ? (
        <View style={searchStyles.panel}>
          <View style={searchStyles.panelHeader}>
            <Text style={searchStyles.panelTitle}>Mọi người</Text>
          </View>

          {users.map((user) => (
            <SearchUserCard
              key={user.id}
              user={user}
              onPress={() => onPressUser(user)}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}
