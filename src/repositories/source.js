import { DATA_SOURCE_MODE } from "@/config/env";
import { getAuthSession } from "@/utils/session";

export const DATA_SOURCES = {
  AUTO: "auto",
  SERVER: "server",
  LOCAL: "local",
};

export const ACTIVE_SOURCES = {
  SERVER: "server",
  LOCAL: "local",
  LOCAL_FALLBACK: "local-fallback",
};

export function getDataSourceMode() {
  return DATA_SOURCE_MODE;
}

export function hasServerSession(session) {
  return Boolean(session?.token && session.source === ACTIVE_SOURCES.SERVER && !session.demoMode);
}

export async function getCurrentSession() {
  return getAuthSession();
}

export function shouldUseServer(session) {
  if (DATA_SOURCE_MODE === DATA_SOURCES.LOCAL) return false;
  if (session?.demoMode || session?.source === ACTIVE_SOURCES.LOCAL) return false;
  if (DATA_SOURCE_MODE === DATA_SOURCES.SERVER) return true;
  return hasServerSession(session);
}

export function canFallbackToLocal() {
  return DATA_SOURCE_MODE === DATA_SOURCES.AUTO;
}

export function getSourceLabel(source) {
  if (DATA_SOURCE_MODE === DATA_SOURCES.SERVER && source !== ACTIVE_SOURCES.SERVER) {
    if (source === ACTIVE_SOURCES.LOCAL) {
      return "Nguồn dữ liệu: Demo local";
    }

    return "Nguồn dữ liệu: Server lỗi";
  }

  if (source === ACTIVE_SOURCES.SERVER) {
    return "Nguồn dữ liệu: Server";
  }

  if (source === ACTIVE_SOURCES.LOCAL_FALLBACK) {
    return "Nguồn dữ liệu: Local fallback";
  }

  return "Nguồn dữ liệu: Demo local";
}

export function isServerPost(post) {
  return post?.source === ACTIVE_SOURCES.SERVER;
}
