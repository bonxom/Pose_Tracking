/**
 * Quy tắc validation cho Authentication
 */

export const validatePhone = (phone) => {
  if (!phone) return "Số điện thoại không được bỏ trống.";
  const phoneRegex = /^0\d{9}$/;
  if (!phoneRegex.test(phone))
    return "Số điện thoại sai định dạng (bắt đầu bằng 0, đủ 10 số).";
  return "";
};

export const validatePassword = (password) => {
  if (!password) return "Mật khẩu không được bỏ trống.";
  const passwordRegex = /^[a-zA-Z0-9]{6,10}$/;
  if (!passwordRegex.test(password))
    return "Mật khẩu từ 6-10 ký tự, không chứa ký tự đặc biệt.";
  return "";
};
