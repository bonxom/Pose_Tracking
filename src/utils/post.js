export function mergeUniquePosts(currentPosts, incomingPosts) {
  if (!Array.isArray(incomingPosts) || incomingPosts.length === 0) {
    return currentPosts;
  }

  const seenIds = new Set(currentPosts.map((item) => item.id));
  const uniqueIncomingPosts = incomingPosts.filter(
    (item) => item?.id && !seenIds.has(item.id),
  );

  return uniqueIncomingPosts.length
    ? [...currentPosts, ...uniqueIncomingPosts]
    : currentPosts;
}

export function mergeRefreshedFeed(currentPosts, firstPagePosts) {
  if (!Array.isArray(firstPagePosts) || firstPagePosts.length === 0) {
    return currentPosts;
  }

  const firstPageIds = new Set(firstPagePosts.map((item) => item?.id));
  const remainingPosts = currentPosts.filter(
    (item) => item?.id && !firstPageIds.has(item.id),
  );

  return [...firstPagePosts, ...remainingPosts];
}
