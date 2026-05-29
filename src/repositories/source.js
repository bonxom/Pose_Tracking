import { getAuthSession } from "@/utils/session";

export const ACTIVE_SOURCES = {
  SERVER: "server",
  LOCAL: "local",
};

export function hasServerSession(session) {
  return Boolean(session?.token && session.source === ACTIVE_SOURCES.SERVER && !session.demoMode);
}

export async function getCurrentSession() {
  return getAuthSession();
}

export function sourceFromResponse(response) {
  return response?.source === ACTIVE_SOURCES.LOCAL
    ? ACTIVE_SOURCES.LOCAL
    : ACTIVE_SOURCES.SERVER;
}

export function getSourceLabel(source) {
  if (source === ACTIVE_SOURCES.SERVER) {
    return "Nguồn dữ liệu: Server";
  }

  if (source === ACTIVE_SOURCES.LOCAL) {
    return "Nguồn dữ liệu: Mock";
  }

  return "Nguồn dữ liệu: Server lỗi";
}

export function isServerPost(post) {
  return post?.source === ACTIVE_SOURCES.SERVER;
}

export function getDataSourceLabel(source) {
  return getSourceLabel(source);
}
