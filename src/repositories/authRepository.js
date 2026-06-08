import authApi from "@/api/auth";
import { backendApi } from "@/api/client";
import { DEFAULT_DEVICE_TOKEN } from "@/config/env";
import { normalizeSession } from "@/repositories/normalizers";
import { ACTIVE_SOURCES, shouldUseServer } from "@/repositories/source";

export async function loginWithPassword(
  phonenumber,
  password,
) {
  const normalizedPhone = phonenumber?.trim();
  const normalizedPassword = password?.trim();

  try {
    const response = await authApi.login({
      phonenumber: normalizedPhone,
      password: normalizedPassword,
      devtoken: DEFAULT_DEVICE_TOKEN,
    });

    if (response?.code === "1000" || response?.code === 1000) {
      const session = normalizeSession(response);
      if (!session.token) {
        throw new Error("Backend login response did not include token");
      }

      return {
        code: "1000",
        message: response.message || "OK",
        data: session,
        source: ACTIVE_SOURCES.SERVER,
      };
    }

    return {
      code: String(response?.code || "BACKEND_LOGIN_FAILED"),
      message: response?.message || "Backend login failed",
      data: null,
      source: ACTIVE_SOURCES.SERVER,
    };
  } catch (error) {
    return {
      code: "NETWORK_ERROR",
      message: error.message || "Backend unavailable",
      data: null,
      source: ACTIVE_SOURCES.SERVER,
    };
  }
}

export async function logoutSession(session) {
  if (!shouldUseServer(session)) {
    return {
      code: "1000",
      message: "Local session cleared",
      source: ACTIVE_SOURCES.LOCAL,
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
