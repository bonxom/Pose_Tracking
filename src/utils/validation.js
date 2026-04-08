export const isPhone = (value) => /^0\d{9}$/.test(value);

export const isEmail = (value) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export const normalizePhoneNumber = (phone) => {
  return phone?.trim() || "";
};

export const validatePhoneNumber = (phonenumber) => {
  if (!phonenumber) return "Số điện thoại không được bỏ trống.";

  if (!isPhone(phonenumber)) {
    return "Số điện thoại phải gồm 10 chữ số và bắt đầu bằng số 0.";
  }

  return "";
};

export const validatePassword = (password) => {
  if (!password) return "Mật khẩu không được bỏ trống.";

  const passwordRegex = /^[a-zA-Z0-9]{6,20}$/;
  if (!passwordRegex.test(password)) {
    return "Mật khẩu từ 6-20 ký tự, không chứa ký tự đặc biệt.";
  }

  return "";
};

export const validateRole = (role) => {
  if (!role) return "Vui lòng chọn vai trò.";

  if (!["GV", "HV"].includes(role)) {
    return "Vai trò chỉ có thể là GV (Giáo viên) hoặc HV (Học viên).";
  }

  return "";
};

export const validateVerifyCode = (code) => {
  if (!code) return "Mã xác thực không được bỏ trống.";

  if (!/^\d{6}$/.test(code)) {
    return "Mã xác thực phải gồm đúng 6 chữ số.";
  }

  return "";
};

/**
 * Validate phone number (phone-only auth)
 * Alias for validatePhoneNumber for backward compatibility
 */
export const validateIdentifier = (identifier) => {
  return validatePhoneNumber(identifier);
};