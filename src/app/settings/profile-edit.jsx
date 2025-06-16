import AppButton from "@/components/common/AppButton";
import AppInput from "@/components/common/AppInput";
import UserAvatar from "@/components/common/UserAvatar";
import BackIcon from "@/components/icons/BackIcon";
import ProfileIcon from "@/components/icons/ProfileIcon";
import colors from "@/constants/colors";
import sizes from "@/constants/sizes";
import {
  getUserInfo,
  mergeOwnProfileWithSession,
  validateProfileUserName,
} from "@/repositories/userRepository";
import { queueProfileUpdate } from "@/services/profileUpdateService";
import { profileCacheState } from "@/state/profileCacheState";
import {
  CACHE_KEY_PROFILE,
  getProfileCacheOwnerKey,
  isProfileCacheValidForSession,
  readCache,
  writeCache,
} from "@/utils/cacheStore";
import { resolveCoverUri } from "@/utils/profile";
import { getAuthSession, subscribeAuthSession } from "@/utils/session";
import { clearCurrentUserSession } from "@/utils/userSessionCleanup";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

function SectionHeader({ title, actionLabel = "Chỉnh sửa", onPress }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {onPress ? (
        <Pressable style={styles.sectionAction} onPress={onPress}>
          <Text style={styles.sectionActionText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function AvatarPreview({ uri, version, name, onPick }) {
  return (
    <View style={styles.avatarPreviewWrap}>
      <View style={styles.avatarPreview}>
        <UserAvatar uri={uri} size={148} />
      </View>
      <Pressable style={styles.cameraFab} onPress={onPick}>
        <ProfileIcon name="camera" size={20} color={colors.ink} />
      </Pressable>
    </View>
  );
}

function CoverPreview({ uri, version, onPick }) {
  const resolvedCoverUri = resolveCoverUri(uri, version);

  return (
    <View style={styles.coverPreview}>
      {resolvedCoverUri ? (
        <Image
          source={{ uri: resolvedCoverUri }}
          style={styles.previewImage}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={150}
        />
      ) : (
        <View style={styles.coverFallback}>
          <ProfileIcon name="image-outline" size={34} color={colors.subtext} />
        </View>
      )}
      <Pressable style={styles.coverCameraButton} onPress={onPick}>
        <ProfileIcon name="camera" size={18} color={colors.ink} />
        <Text style={styles.coverCameraText}>Chỉnh sửa ảnh bìa</Text>
      </Pressable>
    </View>
  );
}

export default function ProfileEditScreen() {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef(null);
  const initialProfileSnapshot = profileCacheState[""]?.profile || {};
  const [username, setUsername] = useState(
    () =>
      initialProfileSnapshot.displayName ||
      initialProfileSnapshot.username ||
      "",
  );
  const [avatar, setAvatar] = useState(
    () => initialProfileSnapshot.avatar || "",
  );
  const [coverImage, setCoverImage] = useState(
    () => initialProfileSnapshot.coverImage || "",
  );
  const [avatarVersion, setAvatarVersion] = useState(
    () => initialProfileSnapshot.avatarVersion || "",
  );
  const [coverVersion, setCoverVersion] = useState(
    () => initialProfileSnapshot.coverVersion || "",
  );
  const [description, setDescription] = useState(
    () => initialProfileSnapshot.description || "",
  );
  const [usernameError, setUsernameError] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(() => !profileCacheState[""]?.profile);
  const [saving, setSaving] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [focusedField, setFocusedField] = useState("");
  const latestDraftRef = useRef({
    username: "",
    avatar: "",
    coverImage: "",
    description: "",
  });
  const diskCacheLoadedRef = useRef(false);

  useEffect(() => {
    latestDraftRef.current = {
      username,
      avatar,
      coverImage,
      description,
    };
  }, [avatar, coverImage, description, username]);

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const handleShow = (event) => {
      setKeyboardHeight(Math.max(0, event?.endCoordinates?.height || 0));
    };

    const handleHide = () => {
      setKeyboardHeight(0);
    };

    const showSubscription = Keyboard.addListener(showEvent, handleShow);
    const hideSubscription = Keyboard.addListener(hideEvent, handleHide);

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const applyProfileSnapshot = useCallback((profileLike = {}) => {
    setUsername(profileLike.displayName || profileLike.username || "");
    setAvatar(profileLike.avatar || "");
    setCoverImage(profileLike.coverImage || "");
    setDescription(profileLike.description || "");
    setAvatarVersion(
      profileLike.avatarVersion || profileLike.profileSyncRequestedAt || "",
    );
    setCoverVersion(
      profileLike.coverVersion || profileLike.profileSyncRequestedAt || "",
    );
  }, []);

  const persistProfileSnapshot = useCallback(async (profileLike = {}) => {
    const session = await getAuthSession();
    const ownerKey = getProfileCacheOwnerKey(session || profileLike);

    if (!ownerKey) {
      return;
    }

    const nextCache = {
      profile: profileLike,
      posts: profileCacheState[""]?.posts || [],
      ownerKey,
    };

    profileCacheState[""] = nextCache;
    writeCache(CACHE_KEY_PROFILE, nextCache);
  }, []);

  const hydrateFromLocalSnapshot = useCallback(async () => {
    const session = await getAuthSession();
    const ownerKey = getProfileCacheOwnerKey(session);
    const memoryCache = profileCacheState[""];

    if (
      memoryCache?.profile &&
      memoryCache?.ownerKey &&
      memoryCache.ownerKey === ownerKey
    ) {
      applyProfileSnapshot(
        mergeOwnProfileWithSession(memoryCache.profile, session || {}),
      );
      return true;
    }

    if (memoryCache?.profile) {
      delete profileCacheState[""];
    }

    if (!diskCacheLoadedRef.current) {
      diskCacheLoadedRef.current = true;
      const cached = await readCache(CACHE_KEY_PROFILE);

      if (isProfileCacheValidForSession(cached, session)) {
        profileCacheState[""] = cached;
        applyProfileSnapshot(
          mergeOwnProfileWithSession(cached.profile, session || {}),
        );
        return true;
      }
    }

    if (!session) return false;

    const draft = latestDraftRef.current;
    const merged = mergeOwnProfileWithSession(
      {
        displayName: draft.username,
        username: draft.username,
        avatar: draft.avatar,
        coverImage: draft.coverImage,
        description: draft.description,
      },
      session,
    );

    const hasSnapshot = Boolean(
      merged.displayName ||
      merged.username ||
      merged.avatar ||
      merged.coverImage ||
      merged.description,
    );

    if (hasSnapshot) {
      applyProfileSnapshot(merged);
    }

    return hasSnapshot;
  }, [applyProfileSnapshot]);

  const loadProfile = useCallback(
    async ({ showLoader = true } = {}) => {
      if (showLoader) {
        setLoading(true);
      }
      setStatus("");
      try {
        const user = await getUserInfo();
        applyProfileSnapshot(user);
        await persistProfileSnapshot(user);
      } catch (error) {
        if (error.sessionExpired) {
          await clearCurrentUserSession();
          router.replace("/(auth)/login");
          return;
        }
        setStatus(error.message || "Không thể tải hồ sơ.");
      } finally {
        setLoading(false);
      }
    },
    [applyProfileSnapshot, persistProfileSnapshot],
  );

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const run = async () => {
        const hasLocalSnapshot = await hydrateFromLocalSnapshot();
        if (!active) return;

        if (hasLocalSnapshot) {
          setLoading(false);
          return;
        }

        await loadProfile({ showLoader: !hasLocalSnapshot });
      };

      run().catch(console.warn);

      return () => {
        active = false;
      };
    }, [hydrateFromLocalSnapshot, loadProfile]),
  );

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const applySession = (session) => {
        if (!active || !session) return;

        const draft = latestDraftRef.current;
        const merged = mergeOwnProfileWithSession(
          {
            displayName: draft.username,
            username: draft.username,
            avatar: draft.avatar,
            coverImage: draft.coverImage,
            description: draft.description,
          },
          session,
        );

        const hasSnapshot = Boolean(
          merged.displayName ||
          merged.username ||
          merged.avatar ||
          merged.coverImage ||
          merged.description,
        );

        if (hasSnapshot) {
          setLoading(false);
        }

        applyProfileSnapshot(merged);
      };

      const unsubscribe = subscribeAuthSession(applySession);

      return () => {
        active = false;
        unsubscribe();
      };
    }, [applyProfileSnapshot]),
  );

  const pickImage = async (type) => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== "granted") {
        Alert.alert(
          "Cần quyền truy cập ảnh",
          "Vui lòng cấp quyền thư viện ảnh để chọn ảnh hồ sơ.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: type === "avatar" ? [1, 1] : [16, 9],
        quality: 0.9,
      });

      if (!result.canceled && result.assets?.length) {
        const uri = result.assets[0].uri;
        if (type === "avatar") {
          setAvatar(uri);
        } else {
          setCoverImage(uri);
        }
        setStatus(
          'Ảnh đã được chọn. Nhấn "Lưu thay đổi" để upload file lên server.',
        );
      }
    } catch {
      Alert.alert(
        "Không thể chọn ảnh",
        "Cơ chế chọn ảnh bị lỗi. Vui lòng thử lại.",
      );
    }
  };

  const saveProfile = async () => {
    const validationError = validateProfileUserName(username);
    if (validationError) {
      setUsernameError(validationError);
      return;
    }

    setSaving(true);
    setStatus("");
    setUsernameError("");
    try {
      const session = await getAuthSession();
      const optimisticProfile = {
        ...session,
        id: session?.id || "",
        displayName: username.trim(),
        username: username.trim(),
        avatar,
        coverImage,
        description: description.trim().slice(0, 150),
        avatarVersion:
          avatar !== (session?.avatar || "")
            ? new Date().toISOString()
            : session?.avatarVersion || "",
        coverVersion:
          coverImage !== (session?.coverImage || "")
            ? new Date().toISOString()
            : session?.coverVersion || "",
        profileSyncStatus: "pending",
        profileSyncRequestedAt: new Date().toISOString(),
      };

      applyProfileSnapshot(optimisticProfile);
      await persistProfileSnapshot(optimisticProfile);
      setLoading(false);

      await queueProfileUpdate({
        userName: username.trim(),
        avatar,
        coverImage,
        description: description.trim().slice(0, 150),
      });
      setStatus("Đã cập nhật giao diện. Backend đang đồng bộ nền...");
      router.replace("/(tabs)/profile");
    } catch (error) {
      if (error.sessionExpired) {
        await clearCurrentUserSession();
        router.replace("/(auth)/login");
        return;
      }
      setStatus(error.message || "Không thể cập nhật hồ sơ.");
    } finally {
      setSaving(false);
    }
  };

  const hasVisibleProfileData = Boolean(
    username || avatar || coverImage || description,
  );
  const extraFocusedPadding =
    focusedField === "description"
      ? sizes.xxl + sizes.lg
      : focusedField === "username"
        ? sizes.xxl
        : 0;
  const baseBottomPadding = Math.max(insets.bottom + sizes.sm, sizes.lg);
  const keyboardInset =
    keyboardHeight > 0
      ? Math.max(0, keyboardHeight - insets.bottom) + sizes.xs
      : 0;
  const contentBottomPadding =
    baseBottomPadding + keyboardInset + extraFocusedPadding;

  const handleFieldFocus = (fieldName) => {
    setFocusedField(fieldName);

    setTimeout(
      () => {
        scrollRef.current?.scrollToEnd({ animated: true });
      },
      fieldName === "description" ? 160 : 120,
    );
  };

  const handleFieldBlur = (fieldName) => {
    setFocusedField((current) => (current === fieldName ? "" : current));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <BackIcon size={24} color={colors.ink} />
        </Pressable>
        <Text style={styles.headerTitle}>Chỉnh sửa trang cá nhân</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading && !hasVisibleProfileData ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={colors.brand} />
          <Text style={styles.mutedText}>Đang tải hồ sơ...</Text>
        </View>
      ) : (
        <>
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={[
              styles.content,
              { paddingBottom: contentBottomPadding },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={
              Platform.OS === "ios" ? "interactive" : "on-drag"
            }
          >
            {loading ? (
              <View style={styles.inlineLoading}>
                <ActivityIndicator size="small" color={colors.brand} />
                <Text style={styles.inlineLoadingText}>
                  Dang dong bo ho so...
                </Text>
              </View>
            ) : null}
            <View style={styles.section}>
              <SectionHeader
                title="Ảnh đại diện"
                onPress={() => pickImage("avatar")}
              />
              <AvatarPreview
                uri={avatar}
                version={avatarVersion}
                name={username}
                onPick={() => pickImage("avatar")}
              />
            </View>

            <View style={styles.section}>
              <SectionHeader
                title="Ảnh bìa"
                onPress={() => pickImage("cover")}
              />
              <CoverPreview
                uri={coverImage}
                version={coverVersion}
                onPick={() => pickImage("cover")}
              />
            </View>

            <View style={styles.section}>
              <SectionHeader title="Thông tin cá nhân" />
              <AppInput
                label="Tên người dùng"
                value={username}
                onChangeText={(value) => {
                  setUsername(value);
                  if (usernameError) setUsernameError("");
                }}
                error={usernameError}
                placeholder="Nhập tên người dùng"
                containerStyle={styles.inputGroup}
                style={styles.input}
                onFocus={() => handleFieldFocus("username")}
                onBlur={() => handleFieldBlur("username")}
              />
              <AppInput
                label={`Tiểu sử (${description.length}/150)`}
                value={description}
                onChangeText={(value) => setDescription(value.slice(0, 150))}
                placeholder="Viết tiểu sử ngắn"
                multiline
                containerStyle={styles.inputGroup}
                style={[styles.input, styles.multilineInput]}
                onFocus={() => handleFieldFocus("description")}
                onBlur={() => handleFieldBlur("description")}
              />

              <AppButton
                title="Lưu thay đổi"
                onPress={saveProfile}
                loading={saving}
                style={styles.saveButton}
                textStyle={styles.saveButtonText}
              />
            </View>

            {status ? <Text style={styles.statusText}>{status}</Text> : null}
          </ScrollView>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.page,
  },
  header: {
    minHeight: 56,
    paddingHorizontal: sizes.md,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderMuted,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceMuted,
  },
  headerTitle: {
    flex: 1,
    marginHorizontal: sizes.sm,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "900",
    color: colors.ink,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    paddingBottom: sizes.lg,
    gap: 8,
  },
  inlineLoading: {
    marginHorizontal: sizes.md,
    marginTop: sizes.md,
    paddingHorizontal: sizes.md,
    paddingVertical: sizes.sm,
    borderRadius: sizes.md,
    flexDirection: "row",
    alignItems: "center",
    gap: sizes.sm,
    backgroundColor: colors.surfaceMuted,
  },
  inlineLoadingText: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.inkMuted,
  },
  section: {
    backgroundColor: colors.white,
    paddingHorizontal: sizes.md,
    paddingTop: sizes.md,
    paddingBottom: sizes.lg,
  },
  sectionHeader: {
    minHeight: 32,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: sizes.md,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "900",
    color: colors.ink,
  },
  sectionAction: {
    minHeight: 32,
    paddingHorizontal: sizes.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionActionText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "800",
    color: colors.brand,
  },
  avatarPreviewWrap: {
    alignSelf: "center",
    marginTop: sizes.md,
    width: 148,
    height: 148,
  },
  avatarPreview: {
    width: 148,
    height: 148,
    borderRadius: 74,
    overflow: "hidden",
    backgroundColor: colors.surfaceMuted,
    borderWidth: 4,
    borderColor: colors.white,
  },
  avatarFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceAccent,
  },
  avatarFallbackText: {
    fontSize: 42,
    fontWeight: "900",
    color: colors.brand,
  },
  cameraFab: {
    position: "absolute",
    right: 4,
    bottom: 6,
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceMuted,
    borderWidth: 3,
    borderColor: colors.white,
  },
  coverPreview: {
    marginTop: sizes.md,
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: colors.surfaceMuted,
  },
  coverFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.borderMuted,
  },
  coverCameraButton: {
    position: "absolute",
    right: 10,
    bottom: 10,
    minHeight: 34,
    borderRadius: 17,
    paddingHorizontal: sizes.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.white,
  },
  coverCameraText: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "900",
    color: colors.ink,
  },
  inputGroup: {
    marginTop: sizes.md,
  },
  input: {
    minHeight: 48,
    borderRadius: 12,
    borderColor: colors.borderInput,
    backgroundColor: colors.white,
    fontSize: 16,
    color: colors.ink,
  },
  multilineInput: {
    minHeight: 96,
    textAlignVertical: "top",
    paddingTop: sizes.sm,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: sizes.md,
    paddingTop: sizes.sm,
    paddingBottom: sizes.md,
    backgroundColor: colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderMuted,
  },
  saveButton: {
    height: 48,
    borderRadius: 8,
    backgroundColor: colors.brand,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: "900",
  },
  statusText: {
    marginHorizontal: sizes.md,
    marginBottom: sizes.sm,
    fontSize: 14,
    lineHeight: 20,
    color: colors.subtext,
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: sizes.sm,
    backgroundColor: colors.white,
  },
  mutedText: {
    fontSize: 14,
    color: colors.subtext,
  },
});
