import { backendApi } from "@/api/client";
import { DEFAULT_DEVICE_TOKEN } from "@/config/env";
import { DEMO_PUSH_SETTINGS } from "@/constants/demo";
import { MOCK_USERS } from "@/constants/mocks/users";
import { extractObject } from "@/repositories/normalizers";
import { assertBackendOk } from "@/repositories/serverResponse";
import {
  ACTIVE_SOURCES,
  canFallbackToLocal,
  getCurrentSession,
  shouldUseServer,
} from "@/repositories/source";

let localPushSettings = { ...DEMO_PUSH_SETTINGS };

export async function getPushSettings() {
  const session = await getCurrentSession();

  if (!shouldUseServer(session)) {
    return { ...localPushSettings, source: ACTIVE_SOURCES.LOCAL };
  }

  try {
    const response = await backendApi.getPushSettings({ token: session.token });

    await assertBackendOk(response, { message: "Backend get_push_settings failed" });

    return { ...localPushSettings, ...extractObject(response), source: ACTIVE_SOURCES.SERVER };
  } catch (error) {
    console.info("[DATA] Server push settings fallback", error.message);

    if (!error.sessionExpired && canFallbackToLocal()) {
      return { ...localPushSettings, source: ACTIVE_SOURCES.LOCAL_FALLBACK };
    }

    throw error;
  }
}

export async function setPushSettings(settings = {}) {
  const session = await getCurrentSession();

  if (!shouldUseServer(session)) {
    localPushSettings = { ...localPushSettings, ...settings };
    return { ...localPushSettings, source: ACTIVE_SOURCES.LOCAL };
  }

  const response = await backendApi.setPushSettings({
    token: session.token,
    ...settings,
  });

  await assertBackendOk(response, { message: "Backend set_push_settings failed" });

  return { ...localPushSettings, ...settings, source: ACTIVE_SOURCES.SERVER };
}

export async function changePassword(oldPassword, newPassword) {
  const session = await getCurrentSession();

  if (!shouldUseServer(session)) {
    const phone = session?.phonenumber || session?.identifier || "";
    const user = MOCK_USERS.find((item) => item.phonenumber === phone);

    if (!user || user.password !== oldPassword) {
      throw new Error("Mật khẩu hiện tại không đúng.");
    }

    user.password = newPassword;
    return { changed: true, source: ACTIVE_SOURCES.LOCAL };
  }

  const response = await backendApi.changePassword({
    token: session.token,
    password: oldPassword,
    new_password: newPassword,
  });

  await assertBackendOk(response, { message: "Backend change_password failed" });

  return { changed: true, source: ACTIVE_SOURCES.SERVER };
}

export async function checkNewVersion() {
  const session = await getCurrentSession();

  if (!shouldUseServer(session)) {
    return {
      version: "mock",
      lastUpdate: "2026-05-17T00:00:00.000Z",
      source: ACTIVE_SOURCES.LOCAL,
    };
  }

  let response = await backendApi.checkNewVersion({
    token: session?.token || "",
    last_update: "2026-05-10T00:00:00.000Z",
  });

  if (String(response?.message || "").includes("property last_update should not exist")) {
    console.info("[DATA] check_new_version deployed compatibility: retrying with lastUpdate");
    response = await backendApi.checkNewVersion({
      token: session?.token || "",
      lastUpdate: "2026-05-10T00:00:00.000Z",
    });
  }

  await assertBackendOk(response, { message: "Backend check_new_version failed" });

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
    devtype: "1",
  });

  await assertBackendOk(response, { message: "Backend set_devtoken failed" });

  return { registered: true, devtoken, source: ACTIVE_SOURCES.SERVER };
}
