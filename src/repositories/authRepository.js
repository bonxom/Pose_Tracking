import authApi from "@/api/auth";
import { backendApi } from "@/api/client";
import { DEFAULT_DEVICE_TOKEN } from "@/config/env";
import { normalizeSession } from "@/repositories/normalizers";
<<<<<<< HEAD
import { ACTIVE_SOURCES } from "@/repositories/source";
=======
import { ACTIVE_SOURCES, shouldUseServer } from "@/repositories/source";
>>>>>>> origin/main

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

<<<<<<< HEAD
export async function loginWithPassword(phonenumber, password, _options = {}) {
  const normalizedPhone = phonenumber?.trim();
  const normalizedPassword = password?.trim();
=======
export async function loginWithPassword(
  phonenumber,
  password,
  options = {},
) {
  const normalizedPhone = phonenumber?.trim();
  const normalizedPassword = password?.trim();
  const allowLocalFallback = Boolean(options.allowLocalFallback);
>>>>>>> origin/main

  try {
    const response = await authApi.login({
      phonenumber: normalizedPhone,
      password: normalizedPassword,
      devtoken: DEFAULT_DEVICE_TOKEN,
    });
<<<<<<< HEAD
    return normalizeLoginResponse(response);
  } catch (error) {
=======

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

    if (allowLocalFallback) {
      console.info(
        "[DATA] Backend login failed, using explicit local demo fallback",
        response,
      );
      return localLogin(normalizedPhone, normalizedPassword);
    }

    return {
      code: String(response?.code || "BACKEND_LOGIN_FAILED"),
      message: response?.message || "Backend login failed",
      data: null,
      source: ACTIVE_SOURCES.SERVER,
    };
  } catch (error) {
    if (allowLocalFallback) {
      console.info(
        "[DATA] Backend unavailable, using explicit local demo fallback",
        error.message,
      );
      return localLogin(normalizedPhone, normalizedPassword);
    }

>>>>>>> origin/main
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
