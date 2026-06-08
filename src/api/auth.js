import { backendApi } from "@/api/client";
import { isPhone } from "@/utils/validation";

function isOk(response) {
  return (
    response?.code === "1000" ||
    response?.code === 1000 ||
    response?.success === true
  );
}

function backendError(response, fallbackMessage = "Backend request failed") {
  return {
    code: String(response?.code || "BACKEND_ERROR"),
    message:
      response?.message || response?.msg || response?.error || fallbackMessage,
    data: null,
  };
}

function networkError(error, fallbackMessage) {
  return {
    code: String(error?.code || "NETWORK_ERROR"),
    message: error?.message || fallbackMessage,
    data: null,
  };
}

function guessImageMimeType(uri = "") {
  const clean = String(uri || "")
    .split("?")[0]
    .toLowerCase();

  if (clean.endsWith(".png")) return "image/png";
  if (clean.endsWith(".webp")) return "image/webp";
  if (clean.endsWith(".gif")) return "image/gif";
  if (clean.endsWith(".heic")) return "image/heic";
  if (clean.endsWith(".heif")) return "image/heif";
  if (clean.endsWith(".jpg") || clean.endsWith(".jpeg")) return "image/jpeg";

  return "image/jpeg";
}

function buildAvatarFile(avatar = "") {
  const uri = String(avatar || "").trim();
  if (!uri) return null;
  if (!/^(file|content|asset-library|ph):\/\//i.test(uri)) return null;

  const mimeType = guessImageMimeType(uri);
  const extByMime = {
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/heic": "heic",
    "image/heif": "heif",
    "image/jpeg": "jpg",
  };
  const fileName = `avatar-${Date.now()}.${extByMime[mimeType] || "jpg"}`;

  return {
    fieldName: "avatar",
    uri,
    name: fileName,
    mimeType,
  };
}

const authApi = {
  /**
   * Dang nhap bang so dien thoai.
   * @param {string} phonenumber
   * @param {string} password
   * @returns {Promise<{code: string, message: string, data: any}>}
   */
  login: async ({ phonenumber, password, devtoken }) => {
    if (!phonenumber || !password) {
      return {
        code: "1002",
        message: "Thieu thong tin dang nhap",
        data: null,
      };
    }

    if (!isPhone(phonenumber)) {
      return {
        code: "1004",
        message: "So dien thoai khong hop le",
        data: null,
      };
    }

    try {
      return await backendApi.login({
        phonenumber,
        password,
        devtoken,
      });
    } catch (error) {
      return networkError(error, "Backend unavailable");
    }
  },

  /**
   * Dang ky moi.
   * @param {Object} params
   * @param {string} params.phonenumber
   * @param {string} params.password
   * @param {string} params.uuid
   * @param {string} params.role - "GV" hoac "HV"
   * @returns {Promise<{code: string, message: string, data: any}>}
   */
  signup: async ({ phonenumber, password, uuid, role }) => {
    if (!phonenumber || !password || !uuid || !role) {
      return {
        code: "1002",
        message: "Parameter is not enough",
        data: null,
      };
    }

    if (!isPhone(phonenumber)) {
      return {
        code: "1004",
        message: "Parameter value is invalid",
        data: null,
      };
    }

    if (!["GV", "HV"].includes(role)) {
      return {
        code: "1004",
        message: "Invalid role",
        data: null,
      };
    }

    try {
      const response = await backendApi.signup({
        phonenumber,
        password,
        uuid,
        role,
      });

      if (!isOk(response)) {
        return backendError(response, "Backend signup failed");
      }

      const data = response.data || {};
      return {
        code: "1000",
        message: response.message || "OK",
        data: {
          ...data,
          signupRequestId:
            data.signupRequestId ||
            data.signup_request_id ||
            data.id ||
            phonenumber,
          phonenumber: data.phonenumber || phonenumber,
          role: data.role || role,
          token:
            data.token ||
            data.access_token ||
            data.accessToken ||
            response.token ||
            "",
          verifyCode:
            data.verifyCode ||
            data.verify_code ||
            data.code ||
            response.verifyCode ||
            response.verify_code ||
            "",
        },
      };
    } catch (error) {
      return networkError(error, "Backend signup unavailable");
    }
  },

  /**
   * Gui lai ma xac thuc.
   * @param {Object} params
   * @param {string} params.phonenumber
   * @returns {Promise<{code: string, message: string, data: any}>}
   */
  getVerifyCode: async ({ phonenumber }) => {
    if (!phonenumber) {
      return {
        code: "1002",
        message: "Parameter is not enough",
        data: null,
      };
    }

    if (!isPhone(phonenumber)) {
      return {
        code: "1004",
        message: "Invalid phone number",
        data: null,
      };
    }

    try {
      const response = await backendApi.getVerifyCode({ phonenumber });
      return isOk(response)
        ? {
            code: "1000",
            message: response.message || "Ma xac thuc da duoc gui.",
            data: response.data || {},
          }
        : backendError(response, "Backend get_verify_code failed");
    } catch (error) {
      return networkError(error, "Backend get_verify_code unavailable");
    }
  },

  /**
   * Kiem tra ma xac thuc.
   * @param {Object} params
   * @param {string} params.phonenumber
   * @param {string} params.code
   * @param {string} params.signupRequestId
   * @returns {Promise<{code: string, message: string, data: any}>}
   */
  checkVerifyCode: async ({ phonenumber, code, signupRequestId }) => {
    if (!phonenumber || !code) {
      return {
        code: "1002",
        message: "Parameter is not enough",
        data: null,
      };
    }

    const candidateBodies = [
      { phonenumber, codeVerify: code },
      { phonenumber, code },
      { phoneNumber: phonenumber, code },
      { phoneNumber: phonenumber, codeVerify: code },
      { phone: phonenumber, code },
      { phonenumber, verify_code: code },
      { phonenumber, code_verify: code },
      { phonenumber, otp: code },
      { phonenumber, verifyCode: code },
      { phonenumber, verifycode: code },
      { code },
      { verify_code: code },
      { code_verify: code },
      { otp: code },
      { phonenumber, code, signupRequestId },
      { phonenumber, code, signup_request_id: signupRequestId },
    ];
    let response = null;
    let lastError = null;

    for (const body of candidateBodies) {
      try {
        response = await backendApi.checkVerifyCode(body);
        if (isOk(response)) break;
      } catch (error) {
        lastError = error;
        response = error?.data || response;
        if (isOk(response)) break;
      }
    }

    if (!isOk(response)) {
      if (lastError && !response) {
        return networkError(lastError, "Backend check_verify_code unavailable");
      }

      return backendError(response, "Backend check_verify_code failed");
    }

    const data = response.data || {};
    return {
      code: "1000",
      message: response.message || "OK",
      data: {
        ...data,
        token:
          data.token ||
          data.access_token ||
          data.accessToken ||
          response.token ||
          "",
        phonenumber: data.phonenumber || phonenumber,
        role: data.role || "",
        signupRequestId:
          data.signupRequestId ||
          data.signup_request_id ||
          signupRequestId ||
          phonenumber,
      },
    };
  },

  /**
   * Hoan thanh dang ky.
   * @param {Object} params
   * @param {string} params.token
   * @param {string} params.phonenumber
   * @param {string} params.username
   * @param {string} params.height
   * @param {string} [params.avatar]
   * @returns {Promise<{code: string, message: string, data: any}>}
   */
  changeInfoAfterSignup: async ({
    token,
    phonenumber,
    username,
    height = "",
    avatar = "",
  }) => {
    if (!token || !username) {
      return {
        code: "1002",
        message: "Parameter is not enough",
        data: null,
      };
    }

    try {
      const avatarFile = buildAvatarFile(avatar);
      const candidateBodies = [
        {
          token,
          username,
          height,
        },
        {
          token,
          user_name: username,
          cover_image: "",
          height,
        },
        {
          token,
          username,
        },
      ];
      let response = null;
      let lastError = null;

      for (const body of candidateBodies) {
        try {
          response = await backendApi.changeInfoAfterSignupMultipart(
            body,
            avatarFile ? [avatarFile] : [],
          );
          if (isOk(response)) break;
        } catch (error) {
          lastError = error;
        }
      }

      if (!isOk(response) && lastError && !response) throw lastError;

      return isOk(response)
        ? {
            code: "1000",
            message: response.message || "OK",
            data: {
              ...(response.data || {}),
              token: response.data?.token || response.token || token,
              phonenumber: response.data?.phonenumber || phonenumber,
              username:
                response.data?.username || response.data?.user_name || username,
              height: response.data?.height || height || "",
              avatar: response.data?.avatar || avatar || "",
            },
          }
        : backendError(response, "Backend change_info_after_signup failed");
    } catch (error) {
      return networkError(
        error,
        "Backend change_info_after_signup unavailable",
      );
    }
  },
};

export default authApi;
