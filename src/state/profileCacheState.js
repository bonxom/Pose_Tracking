export const profileCacheState = {};

export function resetProfileScreenCache() {
  Object.keys(profileCacheState).forEach((key) => {
    delete profileCacheState[key];
  });
}
