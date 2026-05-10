import { backendApi } from "@/api/client";
import { DEFAULT_DEVICE_TOKEN } from "@/config/env";
import { extractObject, isBackendOk } from "@/repositories/normalizers";
import {
  ACTIVE_SOURCES,
  canFallbackToLocal,
  getCurrentSession,
  shouldUseServer,
} from "@/repositories/source";

const LOCAL_PUSH_SETTINGS = {
  like_comment: true,
  from_friends: true,
  requested_friend: true,
  suggested_friend: true,
  birthday: true,
  video: true,
  report: true,
  sound_on: true,
  notification_on: true,
  vibrant_on: true,
  led_on: true,
};

export async function getPushSettings() {
  const session = await getCurrentSession();

  if (!shouldUseServer(session)) {
    return { ...LOCAL_PUSH_SETTINGS, source: ACTIVE_SOURCES.LOCAL };
  }

  try {
    const response = await backendApi.getPushSettings({ token: session.token });

    if (!isBackendOk(response)) {
      throw new Error(response?.message || "Backend get_push_settings failed");
    }

    return { ...LOCAL_PUSH_SETTINGS, ...extractObject(response), source: ACTIVE_SOURCES.SERVER };
  } catch (error) {
    console.info("[DATA] Server push settings fallback", error.message);

    if (canFallbackToLocal()) {
      return { ...LOCAL_PUSH_SETTINGS, source: ACTIVE_SOURCES.LOCAL_FALLBACK };
    }

    throw error;
  }
}

export async function setPushSettings(settings = {}) {
  const session = await getCurrentSession();

  if (!shouldUseServer(session)) {
    return { ...LOCAL_PUSH_SETTINGS, ...settings, source: ACTIVE_SOURCES.LOCAL };
  }

  const response = await backendApi.setPushSettings({
    token: session.token,
    ...settings,
  });

  if (!isBackendOk(response)) {
    throw new Error(response?.message || "Backend set_push_settings failed");
  }

  return { ...LOCAL_PUSH_SETTINGS, ...settings, source: ACTIVE_SOURCES.SERVER };
}

export async function changePassword(oldPassword, newPassword) {
  const session = await getCurrentSession();

  if (!shouldUseServer(session)) {
    return { changed: true, source: ACTIVE_SOURCES.LOCAL };
  }

  const response = await backendApi.changePassword({
    token: session.token,
    password: oldPassword,
    new_password: newPassword,
  });

  if (!isBackendOk(response)) {
    throw new Error(response?.message || "Backend change_password failed");
  }

  return { changed: true, source: ACTIVE_SOURCES.SERVER };
}

export async function checkNewVersion() {
  const session = await getCurrentSession();
  const response = await backendApi.checkNewVersion({
    token: session?.token || "",
    last_update: "2026-05-10T00:00:00.000Z",
  });

  if (!isBackendOk(response)) {
    throw new Error(response?.message || "Backend check_new_version failed");
  }

  return extractObject(response);
}

export async function setDeviceToken(devtoken = DEFAULT_DEVICE_TOKEN) {
  const session = await getCurrentSession();

  if (!shouldUseServer(session)) {
    return { registered: true, devtoken, source: ACTIVE_SOURCES.LOCAL };
  }

  const response = await backendApi.setDevtoken({
    token: session.token,
    devtoken,
  });

  if (!isBackendOk(response)) {
    throw new Error(response?.message || "Backend set_devtoken failed");
  }

  return { registered: true, devtoken, source: ACTIVE_SOURCES.SERVER };
}
