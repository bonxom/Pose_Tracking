import { MOCK_USERS } from "@/constants/mocks/users";

// Giả lập network delay để test loading state
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const authApi = {
  /**
   * Đăng nhập
   * @param {string} phonenumber
   * @param {string} password
   * @returns {Promise<{code: string, message: string, data: any[]}>}
   */
  login: async (phonenumber, password) => {
    await delay(800);

    // Case 4: Missing parameters
    if (!phonenumber || !password) {
      return {
        code: "1002",
        message: "Parameter is not enough",
        data: [],
      };
    }

    // Case 3: Validation checks (SĐT/Password format)
    const phoneRegex = /^0\d{9}$/ ;
    const passwordRegex = /^[a-zA-Z0-9]{6,10}$/ ;

    if (!phoneRegex.test(phonenumber) || !passwordRegex.test(password)) {
      return {
        code: "1004",
        message: "Parameter value is invalid",
        data: [],
      };
    }

    // Tìm user trong danh sách mock
    const user = MOCK_USERS.find((u) => u.phonenumber === phonenumber);

    // Case 2: User is not validated (Số điện thoại chưa đăng ký)
    if (!user) {
      return {
        code: "9995",
        message: "User is not validated",
        data: [],
      };
    }

    // Kiểm tra Password tương ứng
    if (user.password !== password) {
      return {
        code: "1004",
        message: "Parameter value is invalid",
        data: [],
      };
    }

    // Case 1: Success
    return {
      code: "1000",
      message: "OK",
      data: [user.data],
    };
  },

  /**
   * Đăng ký
   * @param {string} phonenumber
   * @param {string} password
   * @param {string} uuid (UUID thiết bị)
   * @returns {Promise<{code: string, message: string, data: any[]}>}
   */
  signup: async (phonenumber, password, uuid) => {
    await delay(800);

    if (!phonenumber || !password || !uuid) {
      return { code: "1002", message: "Parameter is not enough", data: [] };
    }

    return {
      code: "1000",
      message: "OK",
      data: [
        {
          id: "user_mock_002",
          username: "New User",
          token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy_new",
          avatar: "",
          active: -1,
        },
      ],
    };
  },
};

export default authApi;
