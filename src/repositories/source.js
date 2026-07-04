/**
 * Primary author: Nguyen Quang Duc <Duc.NQ235044@sis.hust.edu.vn>
 * Maintainer: Nguyen Quang Duc
 * Ownership: >=90% current git blame on main as of 2026-07-04.
 * Code owner review: .github/CODEOWNERS
 */

import { API_TYPE, API_TYPES } from "@/config/env";
import { getAuthSession } from "@/utils/session";

export const DATA_SOURCES = {
  SERVER: "server",
  LOCAL: "local",
};

export const ACTIVE_SOURCES = {
  SERVER: "server",
  LOCAL: "local",
  LOCAL_FALLBACK: "local-fallback",
};

export function getDataSourceMode() {
  return isMockMode() ? DATA_SOURCES.LOCAL : DATA_SOURCES.SERVER;
}

export function getApiType() {
  return API_TYPE;
}

export function isBackendMode() {
  return API_TYPE === API_TYPES.BACKEND;
}

export function isMockMode() {
  return API_TYPE === API_TYPES.MOCK;
}

export function hasServerSession(session) {
  return Boolean(session?.token && session.source === ACTIVE_SOURCES.SERVER && !session.demoMode);
}

export async function getCurrentSession() {
  return getAuthSession();
}

export function shouldUseServer(session) {
  if (isMockMode()) return false;
  if (session?.demoMode || session?.source === ACTIVE_SOURCES.LOCAL) return false;
  return true;
}

export function canFallbackToLocal() {
  return false;
}

export function getSourceLabel(source) {
  if (isMockMode()) {
    return "Nguồn dữ liệu: Mock";
  }

  if (source === ACTIVE_SOURCES.SERVER) {
    return "Nguồn dữ liệu: Server";
  }

  if (source === ACTIVE_SOURCES.LOCAL) {
    return "Nguồn dữ liệu: Demo local";
  }

  return "Nguồn dữ liệu: Server lỗi";
}

export function isServerPost(post) {
  return post?.source === ACTIVE_SOURCES.SERVER;
}

export function getDataSourceLabel(source) {
  return getSourceLabel(source);
}
