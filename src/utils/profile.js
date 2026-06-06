import { Image } from "react-native";

export function initials(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "U";
}

const DEFAULT_AVATAR_SOURCE = require("@/assets/images/defaultAvatar.png");
const LOCAL_URI_PATTERN = /^(file|content|asset-library|ph):\/\//i;

export function resolveAvatarUri(uri = "", version = "") {
  const cleanUri = String(uri || "").trim();
  if (!cleanUri)
    return Image.resolveAssetSource(DEFAULT_AVATAR_SOURCE)?.uri || "";
  if (LOCAL_URI_PATTERN.test(cleanUri)) return cleanUri;
  return buildAvatarRenderUri(cleanUri, version);
}

export function buildAvatarRenderUri(uri = "", version = "") {
  const cleanUri = String(uri || "").trim();
  const cleanVersion = String(version || "").trim();

  if (!cleanUri) return "";
  if (LOCAL_URI_PATTERN.test(cleanUri)) return cleanUri;
  if (!cleanVersion) return cleanUri;
  if (!/^https?:\/\//i.test(cleanUri)) return cleanUri;

  const separator = cleanUri.includes("?") ? "&" : "?";
  return `${cleanUri}${separator}v=${encodeURIComponent(cleanVersion)}`;
}
