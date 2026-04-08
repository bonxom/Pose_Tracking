export function formatRelativeTime(dateValue) {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Vừa xong";
  }

  const diffMs = Date.now() - date.getTime();

  if (diffMs < 60 * 1000) {
    return "Vừa xong";
  }

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 24) {
    return `${Math.max(1, diffHours)} giờ trước`;
  }

  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 365) {
    return `${Math.max(1, diffDays)} ngày trước`;
  }

  const diffYears = Math.floor(diffDays / 365);
  return `${Math.max(1, diffYears)} năm trước`;
}

export function isFreshPost(dateValue, isOnline = false) {
  if (!isOnline) return false;

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return false;

  return Date.now() - date.getTime() < 10 * 60 * 1000;
}

export function getInitials(name = "") {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) return "U";
  return parts.map((part) => part[0]?.toUpperCase() || "").join("");
}

export function getFileNameFromUri(uri = "") {
  if (!uri) return "video.mp4";
  const segments = uri.split("/");
  return segments[segments.length - 1] || "video.mp4";
}

export function countWords(value = "") {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

export function getUsernameValidationError(username = "", phoneNumber = "") {
  const trimmed = username.trim();

  if (!trimmed) {
    return "Tên hiển thị không được để trống.";
  }

  if (trimmed.length < 2 || trimmed.length > 30) {
    return "Tên hiển thị phải từ 2 đến 30 ký tự.";
  }

  if (/[<>/\\]/.test(trimmed)) {
    return "Tên hiển thị không được chứa ký tự đặc biệt nguy hiểm.";
  }

  if (/https?:\/\//i.test(trimmed) || /^www\./i.test(trimmed)) {
    return "Tên hiển thị không được là đường dẫn.";
  }

  if (/^\d+$/.test(trimmed)) {
    return "Tên hiển thị không được chỉ gồm chữ số.";
  }

  if (phoneNumber && trimmed.replace(/\s+/g, "") === phoneNumber.replace(/\s+/g, "")) {
    return "Tên hiển thị không được trùng số điện thoại.";
  }

  const hasUnsupportedCharacters = /[^0-9A-Za-zÀ-ỹ\s._-]/u.test(trimmed);
  if (hasUnsupportedCharacters) {
    return "Tên hiển thị chứa ký tự không hợp lệ.";
  }

  return "";
}

export function formatHeight(value = "") {
  const digits = value.replace(/[^\d]/g, "");
  if (!digits) return "";
  return digits;
}

export function getHeightValidationError(value = "") {
  const digits = Number.parseInt(value, 10);

  if (!value) {
    return "Vui lòng nhập chiều cao.";
  }

  if (Number.isNaN(digits) || digits < 80 || digits > 260) {
    return "Chiều cao phải trong khoảng 80cm đến 260cm.";
  }

  return "";
}
