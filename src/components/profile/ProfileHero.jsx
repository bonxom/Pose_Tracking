import ProfileIcon from "@/components/icons/ProfileIcon";
import colors from "@/constants/colors";
import profileStyles from "@/styles/profile.styles";
import { initials, resolveAvatarUri } from "@/utils/profile";
import { Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { useEffect, useState } from "react";

function Avatar({ uri, name, size = 72, bordered = false }) {
  const resolvedAvatarUri = resolveAvatarUri(uri);
  const avatarStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };
  const ring = bordered ? 4 : 0;
  const shellSize = size + ring * 2;
  const shellStyle = bordered
    ? {
        width: shellSize,
        height: shellSize,
        borderRadius: shellSize / 2,
        padding: ring,
        backgroundColor: colors.white,
        overflow: "hidden",
      }
    : avatarStyle;
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [resolvedAvatarUri]);

  return (
    <View style={shellStyle}>
      {resolvedAvatarUri && !imageFailed ? (
        <Image
          source={{ uri: resolvedAvatarUri }}
          style={[profileStyles.avatarImage, avatarStyle]}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={150}
          onError={(event) => {
            console.warn("PROFILE_AVATAR_LOAD_ERROR", resolvedAvatarUri, event.nativeEvent?.error);
            setImageFailed(true);
          }}
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
  const iconColor = variant === "primary" ? colors.white : colors.ink;

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
          <ProfileIcon name={icon} size={iconSize} color={iconColor} />
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

function ProfileDetails({ profile }) {
  const city = profile.city || profile.address || "";

  if (!city) return null;

  return (
    <View style={profileStyles.fbProfileDetails}>
      <View style={profileStyles.fbProfileDetailRow}>
        <ProfileIcon name="home" size={18} color={colors.subtext} />
        <Text style={profileStyles.fbProfileDetailText} numberOfLines={1}>
          Sống tại <Text style={profileStyles.fbProfileDetailStrong}>{city}</Text>
        </Text>
      </View>
    </View>
  );
}

export default function ProfileHero({
  profile,
  isOwnProfile,
  onOpenMenu,
  onOpenCoverMenu,
  onOpenAvatarMenu,
}) {
  const displayName = profile.displayName || profile.username;
  const username =
    profile.username && profile.username !== displayName ? profile.username : "";

  return (
    <View style={profileStyles.fbHero}>
      <View style={profileStyles.fbCover}>
        {profile.coverImage ? (
          <Image source={{ uri: profile.coverImage }} style={profileStyles.coverImage} />
        ) : (
          <View style={profileStyles.fbCoverFallback}>
            <ProfileIcon name="image-outline" size={38} color={colors.subtext} />
          </View>
        )}
      </View>

      <View style={profileStyles.fbHeroInfo}>
        <View style={profileStyles.fbAvatarRow}>
          <View>
            <Avatar uri={profile.avatar} name={profile.displayName} size={120} bordered />
            {isOwnProfile ? (
              <Pressable style={profileStyles.fbAvatarCamera} onPress={onOpenAvatarMenu}>
                <ProfileIcon name="camera" size={19} color={colors.ink} />
              </Pressable>
            ) : null}
          </View>
        </View>

        <Text style={profileStyles.fbName} numberOfLines={2}>
          {displayName}
          {username ? (
            <Text style={profileStyles.fbUsername}> ({username})</Text>
          ) : null}
        </Text>
        {profile.description ? (
          <Text style={profileStyles.fbBio} numberOfLines={3}>
            {profile.description}
          </Text>
        ) : null}
        <View style={[profileStyles.fbActionRow, profileStyles.fbOwnActionRow]}>
          <FbButton icon="ellipsis-horizontal" variant="icon" onPress={onOpenMenu} compact />
        </View>
        <ProfileDetails profile={profile} />
      </View>
      {isOwnProfile ? (
        <Pressable
          style={profileStyles.fbCoverCameraFloating}
          onPress={onOpenCoverMenu}
          hitSlop={12}
        >
          <ProfileIcon name="camera" size={18} color={colors.ink} />
        </Pressable>
      ) : null}
    </View>
  );
}
