export function initials(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "U";
}

export const DEFAULT_AVATAR_URL =
  "https://sloganhay.com/wp-content/uploads/2026/03/avatar-mac-dinh-facebook-10.jpg";

export function resolveAvatarUri(uri = "", version = "") {
  const cleanUri = String(uri || "").trim();
  return buildAvatarRenderUri(cleanUri || DEFAULT_AVATAR_URL, version);
}

export function buildAvatarRenderUri(uri = "", version = "") {
  const cleanUri = String(uri || "").trim();
  const cleanVersion = String(version || "").trim();

  if (!cleanUri) return "";
  if (!cleanVersion) return cleanUri;
  if (!/^https?:\/\//i.test(cleanUri)) return cleanUri;

  const separator = cleanUri.includes("?") ? "&" : "?";
  return `${cleanUri}${separator}v=${encodeURIComponent(cleanVersion)}`;
}
