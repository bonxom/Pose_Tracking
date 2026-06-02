import { backendApi } from "@/api/client";
import { DEFAULT_DEVICE_TOKEN } from "@/config/env";
import { extractObject } from "@/repositories/normalizers";
import { assertBackendOk } from "@/repositories/serverResponse";
import { getCurrentSession, sourceFromResponse } from "@/repositories/source";

function toBool(value, fallback = true) {
  if (value === undefined || value === null) return fallback;
  if (typeof value === "boolean") return value;
  return String(value) === "1" || String(value).toLowerCase() === "true";
}

function settingValue(value) {
  return value ? "1" : "0";
}

export function normalizePushSettings(settings = {}) {
  return {
    notificationOn: toBool(
      settings.notificationOn ?? settings.notification_on ?? settings.notification,
      true,
    ),
    likeComment: toBool(
      settings.likeComment ??
        settings.like_comment ??
        settings.like ??
        settings.comment,
      true,
    ),
    fromFriends: toBool(
      settings.fromFriends ??
        settings.from_friends ??
        settings.friend_update ??
        settings.message,
      true,
    ),
    requestedFriend: toBool(
      settings.requestedFriend ??
        settings.requested_friend ??
        settings.friend_request ??
        settings.requested_enrollment,
      true,
    ),
    suggestedFriend: toBool(
      settings.suggestedFriend ??
        settings.suggested_friend ??
        settings.people_you_may_know ??
        settings.approved_course,
      true,
    ),
    birthday: toBool(settings.birthday, true),
    video: toBool(settings.video ?? settings.new_exercise, true),
    report: toBool(settings.report ?? settings.announcement, true),
    soundOn: toBool(settings.soundOn ?? settings.sound_on, true),
    vibrantOn: toBool(
      settings.vibrantOn ?? settings.vibrant_on ?? settings.vibration_on,
      true,
    ),
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

function requireToken(session, message = "Cần đăng nhập để dùng cài đặt.") {
  if (!session?.token) {
    throw new Error(message);
  }
}

export async function getPushSettings() {
  const session = await getCurrentSession();
  requireToken(session, "Cần đăng nhập để tải cài đặt thông báo.");

  try {
    const response = await backendApi.getPushSettings({ token: session.token });

    await assertBackendOk(response, {
      message: "Backend get_push_settings failed",
    });

    return {
      ...normalizePushSettings(extractObject(response)),
      source: sourceFromResponse(response),
    };
  } catch (error) {
    console.info("[DATA] Push settings unavailable", error.message);
    throw error;
  }
}

export async function setPushSettings(settings = {}) {
  const session = await getCurrentSession();
  requireToken(session, "Cần đăng nhập để lưu cài đặt thông báo.");

  const response = await backendApi.setPushSettings({
    token: session.token,
    ...serializePushSettings(settings),
  });

  const code = String(response?.code || "");
  if (code !== "1000" && code !== "1010") {
    await assertBackendOk(response, {
      message: "Backend set_push_settings failed",
    });
  }

  return {
    ...normalizePushSettings({
      ...settings,
      ...extractObject(response),
    }),
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

  return { changed: true, source: sourceFromResponse(response) };
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

  await assertBackendOk(response, { message: "Backend set_devtoken failed" });

  return {
    registered: true,
    devtoken,
    devtype,
    source: sourceFromResponse(response),
  };
}
