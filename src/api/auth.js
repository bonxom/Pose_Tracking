import { backendApi } from "@/api/client";
import { DEFAULT_DEVICE_TOKEN } from "@/config/env";
import { MOCK_USERS } from "@/constants/mocks/users";
import { isBackendMode } from "@/repositories/source";
import { isPhone } from "@/utils/validation";

// Giáº£ láº­p network delay Ä‘á»ƒ test loading state
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Mock verification code storage (in-memory)
const MOCK_VERIFY_CODES = new Map();

function isServerAuthMode() {
  return isBackendMode();
}

function isOk(response) {
  return response?.code === "1000" || response?.code === 1000 || response?.success === true;
}

function backendError(response, fallbackMessage = "Backend request failed") {
  return {
    code: String(response?.code || "BACKEND_ERROR"),
    message: response?.message || response?.msg || response?.error || fallbackMessage,
    data: null,
  };
}

function guessImageMimeType(uri = "") {
  const clean = String(uri || "").split("?")[0].toLowerCase();

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
   * ÄÄƒng nháº­p báº±ng sá»‘ Ä‘iá»‡n thoáº¡i
   * @param {string} phonenumber
   * @param {string} password
   * @returns {Promise<{code: string, message: string, data: any}>}
   */
  login: async (phonenumber, password) => {
    await delay(800);

    const normalizedPhone = phonenumber?.trim();
    const normalizedPassword = password?.trim();

    if (!normalizedPhone || !normalizedPassword) {
      return {
        code: "1002",
        message: "Parameter is not enough",
        data: null,
      };
    }

    if (!isPhone(normalizedPhone)) {
      return {
        code: "1004",
        message: "Parameter value is invalid",
        data: null,
      };
    }

    if (isServerAuthMode()) {
      try {
        const backendResponse = await backendApi.login({
          phonenumber: normalizedPhone,
          password: normalizedPassword,
          devtoken: DEFAULT_DEVICE_TOKEN,
        });

        if (isOk(backendResponse) && backendResponse.data) {
          return {
            code: "1000",
            message: backendResponse.message || "OK",
            data: backendResponse.data,
          };
        }

        return backendError(backendResponse, "Backend login failed");
      } catch (error) {
        return {
          code: "NETWORK_ERROR",
          message: error.message || "Backend unavailable",
          data: null,
        };
      }
    }

    const user = MOCK_USERS.find((u) => u.phonenumber === normalizedPhone);

    if (user && user.password === normalizedPassword) {
      return {
        code: "1000",
        message: "OK",
        data: user.data,
      };
    }

    if (user) {
      return {
        code: "1004",
        message: "Parameter value is invalid",
        data: null,
      };
    }

    return {
      code: "9995",
      message: "User is not validated",
      data: null,
    };
  },

  /**
   * ÄÄƒng kÃ½ má»›i
   * @param {Object} params
   * @param {string} params.phonenumber
   * @param {string} params.password
   * @param {string} params.uuid
   * @param {string} params.role - "GV" hoáº·c "HV"
   * @returns {Promise<{code: string, message: string, data: any}>}
   */
  signup: async ({ phonenumber, password, uuid, role }) => {
    await delay(800);

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

    if (isServerAuthMode()) {
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
            signupRequestId: data.signupRequestId || data.signup_request_id || data.id || phonenumber,
            phonenumber: data.phonenumber || phonenumber,
            role: data.role || role,
            token: data.token || data.access_token || data.accessToken || response.token || "",
            verifyCode:
              data.verifyCode ||
              data.verify_code ||
              data.code ||
              data.mock_verify_code ||
              response.verifyCode ||
              response.verify_code ||
              "",
          },
        };
      } catch (error) {
        return {
          code: "NETWORK_ERROR",
          message: error.message || "Backend signup unavailable",
          data: null,
        };
      }
    }

    // Cháº·n duplicate phone number
    const existingUser = MOCK_USERS.find((u) => u.phonenumber === phonenumber);
    if (existingUser) {
      return {
        code: "9998",
        message: "Số điện thoại đã được đăng ký.",
        data: null,
      };
    }

    // Mock verify code (in thá»±c táº¿ sáº½ gá»­i SMS/email)
    const mockVerifyCode = "123456";
    const signupRequestId = `signup_${Date.now()}`;

    // LÆ°u vÃ o memory Ä‘á»ƒ check sau (lÆ°u cáº£ password Ä‘á»ƒ sá»­ dá»¥ng sau)
    MOCK_VERIFY_CODES.set(signupRequestId, {
      phonenumber,
      password,
      code: mockVerifyCode,
      role,
      createdAt: Date.now(),
    });

    return {
      code: "1000",
      message: "OK",
      data: {
        signupRequestId,
        phonenumber,
        role,
        mock_verify_code: mockVerifyCode, // Cho dev dÃ¹ng
      },
    };
  },

  /**
   * Gá»­i láº¡i mÃ£ xÃ¡c thá»±c (pháº£i cÃ³ signupRequestId)
   * @param {Object} params
   * @param {string} params.phonenumber
   * @param {string} params.signupRequestId
   * @returns {Promise<{code: string, message: string, data: any}>}
   */
  getVerifyCode: async ({ phonenumber, signupRequestId }) => {
    await delay(500);

    if (!phonenumber || (!signupRequestId && !isServerAuthMode())) {
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

    if (isServerAuthMode()) {
      try {
        const response = await backendApi.getVerifyCode({ phonenumber });
        return isOk(response) ? {
          code: "1000",
          message: response.message || "Mã xác thực đã được gửi.",
          data: response.data || {},
        } : backendError(response, "Backend get_verify_code failed");
      } catch (error) {
        return {
          code: "NETWORK_ERROR",
          message: error.message || "Backend get_verify_code unavailable",
          data: null,
        };
      }
    }

    // Verify request tá»“n táº¡i
    const stored = MOCK_VERIFY_CODES.get(signupRequestId);
    if (!stored) {
      return {
        code: "1004",
        message: "Invalid signup request",
        data: null,
      };
    }

    // Mock: mÃ£ xÃ¡c thá»±c
    const mockCode = "123456";
    console.warn("[MOCK] Verify code sent:", mockCode);

    return {
      code: "1000",
      message: "Mã xác thực đã được gửi tới số điện thoại của bạn.",
      data: {
        mock_verify_code: mockCode,
      },
    };
  },

  /**
   * Kiá»ƒm tra mÃ£ xÃ¡c thá»±c
   * @param {Object} params
   * @param {string} params.phonenumber
   * @param {string} params.code
   * @param {string} params.signupRequestId
   * @returns {Promise<{code: string, message: string, data: any}>}
   */
  checkVerifyCode: async ({ phonenumber, code, signupRequestId }) => {
    await delay(800);

    if (!phonenumber || !code || (!signupRequestId && !isServerAuthMode())) {
      return {
        code: "1002",
        message: "Parameter is not enough",
        data: null,
      };
    }

    if (isServerAuthMode()) {
      try {
        const candidateBodies = [
          { phonenumber, code },
          { phonenumber, codeVerify: code },
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
            return {
              code: String(lastError.code || "NETWORK_ERROR"),
              message: lastError.message || "Backend check_verify_code unavailable",
              data: null,
            };
          }
          return backendError(response, "Backend check_verify_code failed");
        }

        const data = response.data || {};
        return {
          code: "1000",
          message: response.message || "OK",
          data: {
            ...data,
            token: data.token || data.access_token || data.accessToken || response.token || "",
            phonenumber: data.phonenumber || phonenumber,
            role: data.role || "",
            signupRequestId: data.signupRequestId || data.signup_request_id || signupRequestId || phonenumber,
          },
        };
      } catch (error) {
        return {
          code: "NETWORK_ERROR",
          message: error.message || "Backend check_verify_code unavailable",
          data: null,
        };
      }
    }

    const stored = MOCK_VERIFY_CODES.get(signupRequestId);

    if (!stored) {
      return {
        code: "1004",
        message: "Invalid signup request",
        data: null,
      };
    }

    // Check phone khá»›p vá»›i request
    if (stored.phonenumber !== phonenumber) {
      return {
        code: "1004",
        message: "Phone number does not match signup request",
        data: null,
      };
    }

    // Check code
    if (stored.code !== code) {
      return {
        code: "1004",
        message: "Invalid verification code",
        data: null,
      };
    }

    // Code Ä‘Ãºng -> tráº£ vá» user data Ä‘á»ƒ tiáº¿p tá»¥c change-info
    return {
      code: "1000",
      message: "OK",
      data: {
        id: `user_${signupRequestId}`,
        token: `token_${Date.now()}`,
        phonenumber,
        role: stored.role,
        signupRequestId, // Tráº£ vá» Ä‘á»ƒ láº¥y password sau
      },
    };
  },

  /**
   * HoÃ n thÃ nh Ä‘Äƒng kÃ½ (cáº­p nháº­t thÃ´ng tin)
   * @param {Object} params
   * @param {string} params.token
   * @param {string} params.phonenumber
   * @param {string} params.username
   * @param {string} params.height
   * @param {string} [params.avatar]
   * @param {string} params.signupRequestId
   * @returns {Promise<{code: string, message: string, data: any}>}
   */
  changeInfoAfterSignup: async ({ token, phonenumber, username, height = "", avatar = "", signupRequestId }) => {
    await delay(800);

    if (!token || !username || (!phonenumber && !isServerAuthMode()) || (!signupRequestId && !isServerAuthMode())) {
      return {
        code: "1002",
        message: "Parameter is not enough",
        data: null,
      };
    }

    if (isServerAuthMode()) {
      try {
        const avatarFile = buildAvatarFile(avatar);
        const avatarValue = avatarFile ? "" : avatar;
        const candidateBodies = [
          {
            token,
            username,
            avatar: avatarValue,
            height,
          },
          {
            token,
            user_name: username,
            avatar: avatarValue,
            cover_image: "",
            height,
          },
          {
            token,
            username,
            avatar: avatarValue,
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

        return isOk(response) ? {
          code: "1000",
          message: response.message || "OK",
          data: {
            ...(response.data || {}),
            token: response.data?.token || response.token || token,
            phonenumber: response.data?.phonenumber || phonenumber,
            username: response.data?.username || response.data?.user_name || username,
            height: response.data?.height || height || "",
            avatar: response.data?.avatar || avatar || "",
          },
        } : backendError(response, "Backend change_info_after_signup failed");
      } catch (error) {
        return {
          code: "NETWORK_ERROR",
          message: error.message || "Backend change_info_after_signup unavailable",
          data: null,
        };
      }
    }

    // Láº¥y password tá»« signup request
    const signupData = MOCK_VERIFY_CODES.get(signupRequestId);
    if (!signupData) {
      return {
        code: "1004",
        message: "Invalid signup request",
        data: null,
      };
    }

    const password = signupData.password;
    const role = signupData.role;

    // Mock: lÆ°u user vÃ o MOCK_USERS (thá»±c táº¿ sáº½ lÃ  DB)
    const newUser = {
      phonenumber,
      password, // LÆ°u password tháº­t tá»« signup
      role,
      verified: true,
      data: {
        id: token.split("_")[1] || `user_${Date.now()}`,
        username,
        token,
        avatar: avatar || "",
        active: 1,
        role,
        phonenumber,
        height,
        source: "local",
        demoMode: true,
      },
    };

    // ThÃªm vÃ o MOCK_USERS (Ä‘á»ƒ láº§n sau login Ä‘Æ°á»£c)
    const exists = MOCK_USERS.findIndex((u) => u.phonenumber === phonenumber);
    if (exists === -1) {
      MOCK_USERS.push(newUser);
    } else {
      MOCK_USERS[exists] = newUser;
    }

    // XÃ³a signup request sau khi hoÃ n thÃ nh
    MOCK_VERIFY_CODES.delete(signupRequestId);

    return {
      code: "1000",
      message: "OK",
      data: newUser.data,
    };
  },
};

export default authApi;
