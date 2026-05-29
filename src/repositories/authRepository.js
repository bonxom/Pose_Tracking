import { backendApi } from "@/api/client";
import { DEFAULT_DEVICE_TOKEN } from "@/config/env";
import { normalizeSession } from "@/repositories/normalizers";
import { ACTIVE_SOURCES } from "@/repositories/source";

function normalizeLoginResponse(response) {
  if (response?.code === "1000" || response?.code === 1000) {
    const session = normalizeSession(response);
    if (!session.token) {
      throw new Error("Backend login response did not include token");
    }

    return {
      code: "1000",
      message: response.message || "OK",
      data: session,
      source: session.source || ACTIVE_SOURCES.SERVER,
    };
  }

  return {
    code: String(response?.code || "BACKEND_LOGIN_FAILED"),
    message: response?.message || "Backend login failed",
    data: null,
    source: response?.source || ACTIVE_SOURCES.SERVER,
  };
}

export async function loginWithPassword(phonenumber, password, _options = {}) {
  const normalizedPhone = phonenumber?.trim();
  const normalizedPassword = password?.trim();

  try {
    const response = await backendApi.login({
      phonenumber: normalizedPhone,
      password: normalizedPassword,
      devtoken: DEFAULT_DEVICE_TOKEN,
    });
    return normalizeLoginResponse(response);
  } catch (error) {
    return {
      code: "NETWORK_ERROR",
      message: error.message || "Backend unavailable",
      data: null,
      source: ACTIVE_SOURCES.SERVER,
    };
  }
}

export async function loginDemoStudent() {
  return normalizeLoginResponse(await backendApi.loginDemoStudent());
}

export async function loginDemoTeacher() {
  return normalizeLoginResponse(await backendApi.loginDemoTeacher());
}

export async function logoutSession(session) {
  if (!session?.token) {
    return {
      code: "1000",
      message: "Session cleared",
      source: session?.source || ACTIVE_SOURCES.SERVER,
    };
  }

  try {
    const response = await backendApi.logout({
      token: session.token,
    });

    return {
      code: String(response?.code || "1000"),
      message: response?.message || "Logged out",
      source: ACTIVE_SOURCES.SERVER,
    };
  } catch (error) {
    return {
      code: "NETWORK_ERROR",
      message:
        error.message || "Backend logout unavailable; local session cleared",
      source: ACTIVE_SOURCES.SERVER,
    };
  }
}
