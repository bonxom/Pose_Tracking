export const feedCacheState = {
  homeFeedCache: [],
  coursesFeedCache: [],
  coursesCacheLoaded: false,
};

export function resetHomeFeedCache() {
  feedCacheState.homeFeedCache = [];
}

export function resetCoursesFeedCache() {
  feedCacheState.coursesFeedCache = [];
  feedCacheState.coursesCacheLoaded = false;
}
