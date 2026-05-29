import { backendApi } from "@/api/client";
import { DEFAULT_DEVICE_TOKEN } from "@/config/env";
import { extractObject } from "@/repositories/normalizers";
import { assertBackendOk } from "@/repositories/serverResponse";
import { getCurrentSession, sourceFromResponse } from "@/repositories/source";

export async function getPushSettings() {
  const session = await getCurrentSession();

  try {
    const response = await backendApi.getPushSettings({ token: session.token });

    await assertBackendOk(response, {
      message: "Backend get_push_settings failed",
    });

    return {
      ...extractObject(response),
      source: sourceFromResponse(response),
    };
  } catch (error) {
    console.info("[DATA] Push settings unavailable", error.message);
    throw error;
  }
}

export async function setPushSettings(settings = {}) {
  const session = await getCurrentSession();

  const response = await backendApi.setPushSettings({
    token: session.token,
    ...settings,
  });

  await assertBackendOk(response, {
    message: "Backend set_push_settings failed",
  });

  return { ...settings, ...extractObject(response), source: sourceFromResponse(response) };
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

  return { changed: true, source: sourceFromResponse(response) };
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

export async function setDeviceToken(devtoken = DEFAULT_DEVICE_TOKEN) {
  const session = await getCurrentSession();

  const response = await backendApi.setDevtoken({
    token: session.token,
    devtoken,
    devtype: "1",
  });

  await assertBackendOk(response, { message: "Backend set_devtoken failed" });

  return { registered: true, devtoken, source: sourceFromResponse(response) };
}
