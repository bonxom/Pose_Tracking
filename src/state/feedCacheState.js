export const feedCacheState = {
  homeFeedCache: [],
  coursesFeedCache: [],
  coursesCacheLoaded: false,
  reportedPostIds: new Set(),
};

export function addReportedPostId(postId) {
  if (postId) {
    feedCacheState.reportedPostIds.add(postId);
  }
}

export function isPostReported(postId) {
  return feedCacheState.reportedPostIds.has(postId);
}

export function resetHomeFeedCache() {
  feedCacheState.homeFeedCache = [];
}

export function resetCoursesFeedCache() {
  feedCacheState.coursesFeedCache = [];
  feedCacheState.coursesCacheLoaded = false;
}
