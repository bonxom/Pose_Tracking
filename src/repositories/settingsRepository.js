import { backendApi } from "@/api/client";
import { DEFAULT_DEVICE_TOKEN } from "@/config/env";
import { extractObject } from "@/repositories/normalizers";
import { assertBackendOk } from "@/repositories/serverResponse";
import { ACTIVE_SOURCES, getCurrentSession } from "@/repositories/source";

const localPushSettings = {
  notificationOn: true,
  likeComment: true,
  fromFriends: true,
  requestedFriend: true,
  suggestedFriend: true,
  birthday: true,
  video: true,
  report: true,
  soundOn: true,
  vibrantOn: true,
  ledOn: true,
};

function toBool(value, fallback = true) {
  if (value === undefined || value === null) return fallback;
  if (typeof value === "boolean") return value;

  const normalized = String(value).trim().toLowerCase();

  if (normalized === "1" || normalized === "true") return true;
  if (normalized === "0" || normalized === "false") return false;

  return fallback;
}

function settingValue(value) {
  return value ? "1" : "0";
}

export function normalizePushSettings(settings = {}) {
  return {
    likeComment: toBool(settings.likeComment ?? settings.like_comment, true),
    fromFriends: toBool(settings.fromFriends ?? settings.from_friends, true),
    requestedFriend: toBool(
      settings.requestedFriend ?? settings.requested_friend,
      true,
    ),
    suggestedFriend: toBool(
      settings.suggestedFriend ?? settings.suggested_friend,
      true,
    ),
    birthday: toBool(settings.birthday, true),
    video: toBool(settings.video, true),
    report: toBool(settings.report, true),
    soundOn: toBool(settings.soundOn ?? settings.sound_on, true),
    notificationOn: toBool(
      settings.notificationOn ?? settings.notification_on,
      true,
    ),
    vibrantOn: toBool(settings.vibrantOn ?? settings.vibrant_on, true),
    ledOn: toBool(settings.ledOn ?? settings.led_on, true),
  };
}

function serializePushSettings(settings = {}) {
  const normalized = normalizePushSettings(settings);

  return {
    notificationOn: settingValue(normalized.notificationOn),
    likeComment: settingValue(normalized.likeComment),
    fromFriends: settingValue(normalized.fromFriends),
    requestedFriend: settingValue(normalized.requestedFriend),
    suggestedFriend: settingValue(normalized.suggestedFriend),
    birthday: settingValue(normalized.birthday),
    video: settingValue(normalized.video),
    report: settingValue(normalized.report),
    soundOn: settingValue(normalized.soundOn),
    vibrantOn: settingValue(normalized.vibrantOn),
    ledOn: settingValue(normalized.ledOn),
  };
}

export async function getPushSettings() {
  const session = await getCurrentSession();

  if (!session?.token) {
    return {
      ...normalizePushSettings(localPushSettings),
      source: ACTIVE_SOURCES.LOCAL,
    };
  }

  try {
    const response = await backendApi.getPushSettings({ token: session.token });

    await assertBackendOk(response, {
      message: "Backend get_push_settings failed",
    });

    return {
      ...normalizePushSettings({
        ...localPushSettings,
        ...extractObject(response),
      }),
      source: ACTIVE_SOURCES.SERVER,
    };
  } catch (error) {
    console.info("[DATA] Server push settings fallback", error.message);
    throw error;
  }
}

export async function setPushSettings(settings = {}) {
  const session = await getCurrentSession();

  if (!session?.token) {
    throw new Error("Bạn cần đăng nhập để lưu cài đặt thông báo.");
  }

  const response = await backendApi.setPushSettings({
    token: session.token,
    ...serializePushSettings(settings),
  });

  const code = String(response?.code || "");

  // Backend trả 1010 khi setting đã giống giá trị yêu cầu.
  // Trường hợp này vẫn coi là lưu thành công.
  if (code === "1000" || code === "1010") {
    return {
      ...normalizePushSettings(settings),
      source: ACTIVE_SOURCES.SERVER,
    };
  }

  console.info("[DATA] setPushSettings response:", response);

  await assertBackendOk(response, {
    message: "Backend set_push_settings failed",
  });

  return {
    ...normalizePushSettings(settings),
    source: ACTIVE_SOURCES.SERVER,
  };
}

export async function changePassword(oldPassword, newPassword) {
  const session = await getCurrentSession();

  const response = await backendApi.changePassword({
    token: session.token,
    password: oldPassword,
    new_password: newPassword,
  });

  await assertBackendOk(response, {
    message: "Backend change_password failed",
  });

  return { changed: true, source: ACTIVE_SOURCES.SERVER };
}

export async function checkNewVersion() {
  const session = await getCurrentSession();

  let response = await backendApi.checkNewVersion({
    token: session?.token || "",
    last_update: "2026-05-10T00:00:00.000Z",
  });

  if (
    String(response?.message || "").includes(
      "property last_update should not exist",
    )
  ) {
    console.info(
      "[DATA] check_new_version deployed compatibility: retrying with lastUpdate",
    );

    response = await backendApi.checkNewVersion({
      token: session?.token || "",
      lastUpdate: "2026-05-10T00:00:00.000Z",
    });
  }

  await assertBackendOk(response, {
    message: "Backend check_new_version failed",
  });

  return extractObject(response);
}

export async function setDeviceToken(
  devtoken = DEFAULT_DEVICE_TOKEN,
  devtype = "1",
) {
  const session = await getCurrentSession();

  if (!session?.token) {
    return null;
  }

  const response = await backendApi.setDevtoken({
    token: session.token,
    devtoken,
    devtype,
  });

  await assertBackendOk(response, {
    message: "Backend set_devtoken failed",
  });

  return {
    registered: true,
    devtoken,
    devtype,
    source: ACTIVE_SOURCES.SERVER,
  };
}