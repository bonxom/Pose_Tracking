import { MOCK_USERS } from "@/constants/mocks/users";
import { isPhone } from "@/utils/validation";

// Giả lập network delay để test loading state
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Mock verification code storage (in-memory)
const MOCK_VERIFY_CODES = new Map();

const authApi = {
  /**
   * Đăng nhập bằng số điện thoại
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

    const user = MOCK_USERS.find((u) => u.phonenumber === normalizedPhone);

    if (!user) {
      return {
        code: "9995",
        message: "User is not validated",
        data: null,
      };
    }

    if (user.password !== normalizedPassword) {
      return {
        code: "1004",
        message: "Parameter value is invalid",
        data: null,
      };
    }

    return {
      code: "1000",
      message: "OK",
      data: user.data,
    };
  },

  /**
   * Đăng ký mới
   * @param {Object} params
   * @param {string} params.phonenumber
   * @param {string} params.password
   * @param {string} params.uuid
   * @param {string} params.role - "GV" hoặc "HV"
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

    // Chặn duplicate phone number
    const existingUser = MOCK_USERS.find((u) => u.phonenumber === phonenumber);
    if (existingUser) {
      return {
        code: "9998",
        message: "Số điện thoại đã được đăng ký.",
        data: null,
      };
    }

    // Mock verify code (in thực tế sẽ gửi SMS/email)
    const mockVerifyCode = "123456";
    const signupRequestId = `signup_${Date.now()}`;

    // Lưu vào memory để check sau (lưu cả password để sử dụng sau)
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
        mock_verify_code: mockVerifyCode, // Cho dev dùng
      },
    };
  },

  /**
   * Gửi lại mã xác thực (phải có signupRequestId)
   * @param {Object} params
   * @param {string} params.phonenumber
   * @param {string} params.signupRequestId
   * @returns {Promise<{code: string, message: string, data: any}>}
   */
  getVerifyCode: async ({ phonenumber, signupRequestId }) => {
    await delay(500);

    if (!phonenumber || !signupRequestId) {
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

    // Verify request tồn tại
    const stored = MOCK_VERIFY_CODES.get(signupRequestId);
    if (!stored) {
      return {
        code: "1004",
        message: "Invalid signup request",
        data: null,
      };
    }

    // Mock: mã xác thực
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
   * Kiểm tra mã xác thực
   * @param {Object} params
   * @param {string} params.phonenumber
   * @param {string} params.code
   * @param {string} params.signupRequestId
   * @returns {Promise<{code: string, message: string, data: any}>}
   */
  checkVerifyCode: async ({ phonenumber, code, signupRequestId }) => {
    await delay(800);

    if (!phonenumber || !code || !signupRequestId) {
      return {
        code: "1002",
        message: "Parameter is not enough",
        data: null,
      };
    }

    const stored = MOCK_VERIFY_CODES.get(signupRequestId);

    if (!stored) {
      return {
        code: "1004",
        message: "Invalid signup request",
        data: null,
      };
    }

    // Check phone khớp với request
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

    // Code đúng -> trả về user data để tiếp tục change-info
    return {
      code: "1000",
      message: "OK",
      data: {
        id: `user_${signupRequestId}`,
        token: `token_${Date.now()}`,
        phonenumber,
        role: stored.role,
        signupRequestId, // Trả về để lấy password sau
      },
    };
  },

  /**
   * Hoàn thành đăng ký (cập nhật thông tin)
   * @param {Object} params
   * @param {string} params.token
   * @param {string} params.phonenumber
   * @param {string} params.username
   * @param {string} params.height
   * @param {string} [params.avatar]
   * @param {string} params.signupRequestId
   * @returns {Promise<{code: string, message: string, data: any}>}
   */
  changeInfoAfterSignup: async ({ token, phonenumber, username, height, avatar = "", signupRequestId }) => {
    await delay(800);

    if (!token || !phonenumber || !username || !height || !signupRequestId) {
      return {
        code: "1002",
        message: "Parameter is not enough",
        data: null,
      };
    }

    // Lấy password từ signup request
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

    // Mock: lưu user vào MOCK_USERS (thực tế sẽ là DB)
    const newUser = {
      phonenumber,
      password, // Lưu password thật từ signup
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
      },
    };

    // Thêm vào MOCK_USERS (để lần sau login được)
    const exists = MOCK_USERS.findIndex((u) => u.phonenumber === phonenumber);
    if (exists === -1) {
      MOCK_USERS.push(newUser);
    } else {
      MOCK_USERS[exists] = newUser;
    }

    // Xóa signup request sau khi hoàn thành
    MOCK_VERIFY_CODES.delete(signupRequestId);

    return {
      code: "1000",
      message: "OK",
      data: newUser.data,
    };
  },
};

export default authApi;