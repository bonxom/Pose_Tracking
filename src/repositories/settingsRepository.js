import { backendApi } from "@/api/client";
import { DEFAULT_DEVICE_TOKEN } from "@/config/env";
import { extractObject } from "@/repositories/normalizers";
import { assertBackendOk } from "@/repositories/serverResponse";
import { getCurrentSession, sourceFromResponse } from "@/repositories/source";

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

function requireToken(session, message = "Cần đăng nhập để dùng cài đặt.") {
  if (!session?.token) {
    throw new Error(message);
  }
}

let lastKnownPushSettings = null;

export function normalizePushSettings(settings = {}, previousSettings = {}) {
  const fallbackFor = (key) =>
    previousSettings?.[key] !== undefined ? previousSettings[key] : true;

  return {
    notificationOn: toBool(
      settings.notificationOn ??
        settings.notification_on ??
        settings.notification,
      fallbackFor("notificationOn"),
    ),
    likeComment: toBool(
      settings.likeComment ??
        settings.like_comment ??
        settings.like ??
        settings.comment,
      fallbackFor("likeComment"),
    ),
    fromFriends: toBool(
      settings.fromFriends ??
        settings.from_friends ??
        settings.friend_update ??
        settings.message,
      fallbackFor("fromFriends"),
    ),
    requestedFriend: toBool(
      settings.requestedFriend ??
        settings.requested_friend ??
        settings.friend_request ??
        settings.requested_enrollment,
      fallbackFor("requestedFriend"),
    ),
    suggestedFriend: toBool(
      settings.suggestedFriend ??
        settings.suggested_friend ??
        settings.people_you_may_know ??
        settings.approved_course,
      fallbackFor("suggestedFriend"),
    ),
    birthday: toBool(settings.birthday, fallbackFor("birthday")),
    video: toBool(
      settings.video ?? settings.new_exercise,
      fallbackFor("video"),
    ),
    report: toBool(
      settings.report ?? settings.announcement,
      fallbackFor("report"),
    ),
    soundOn: toBool(
      settings.soundOn ?? settings.sound_on,
      fallbackFor("soundOn"),
    ),
    vibrantOn: toBool(
      settings.vibrantOn ?? settings.vibrant_on ?? settings.vibration_on,
      fallbackFor("vibrantOn"),
    ),
    ledOn: toBool(
      settings.ledOn ?? settings.led_on,
      fallbackFor("ledOn"),
    ),
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
  requireToken(session, "Cần đăng nhập để tải cài đặt thông báo.");

  const response = await backendApi.getPushSettings({
    token: session.token,
  });

  await assertBackendOk(response, {
    message: "Backend get_push_settings failed",
  });

  const normalized = normalizePushSettings(
    extractObject(response),
    lastKnownPushSettings || undefined,
  );

  lastKnownPushSettings = normalized;

  return {
    ...normalized,
    source: sourceFromResponse(response),
  };
}

export async function setPushSettings(settings = {}) {
  const session = await getCurrentSession();
  requireToken(session, "Cần đăng nhập để lưu cài đặt thông báo.");

  const response = await backendApi.setPushSettings({
    token: session.token,
    ...serializePushSettings(settings),
  });

  const code = String(response?.code || "");

  // Backend trả 1010 khi setting đã giống giá trị yêu cầu.
  // Trường hợp này vẫn coi là lưu thành công.
  if (code !== "1000" && code !== "1010") {
    await assertBackendOk(response, {
      message: "Backend set_push_settings failed",
    });
  }

  const normalized = normalizePushSettings(
    {
      ...settings,
      ...extractObject(response),
    },
    lastKnownPushSettings || normalizePushSettings(settings),
  );

  lastKnownPushSettings = normalized;

  return {
    ...normalized,
    source: sourceFromResponse(response),
  };
}

export async function changePassword(oldPassword, newPassword) {
  const session = await getCurrentSession();
  requireToken(session, "Cần đăng nhập để đổi mật khẩu.");

  const response = await backendApi.changePassword({
    token: session.token,
    password: oldPassword,
    new_password: newPassword,
  });

  await assertBackendOk(response, {
    message: "Backend change_password failed",
  });

  return {
    changed: true,
    source: sourceFromResponse(response),
  };
}

export async function checkNewVersion() {
  const session = await getCurrentSession();

  let response;

  try {
    response = await backendApi.checkNewVersion({
      token: session?.token || "",
      last_update: "2026-05-10T00:00:00.000Z",
    });
  } catch (error) {
    const message = String(error?.data?.message || error?.message || "");

    if (!message.includes("property last_update should not exist")) {
      throw error;
    }

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
  requireToken(session, "Cần đăng nhập để gửi device token.");

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
    source: sourceFromResponse(response),
  };
}