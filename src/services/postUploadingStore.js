function createId() {
  return `uploading_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

const listeners = new Set();

const state = {
  uploadingCards: [],
  finishedPosts: [],
};

function snapshot() {
  return {
    uploadingCards: [...state.uploadingCards],
    finishedPosts: [...state.finishedPosts],
  };
}

function emit() {
  const next = snapshot();
  listeners.forEach((listener) => {
    listener(next);
  });
}

export function subscribePostUploading(listener) {
  listeners.add(listener);
  listener(snapshot());
  return () => {
    listeners.delete(listener);
  };
}

export function enqueuePostUploading({ avatarUri = "" } = {}) {
  const id = createId();
  state.uploadingCards = [
    {
      id,
      avatarUri,
      text: "Đang đăng",
      createdAt: new Date().toISOString(),
    },
    ...state.uploadingCards,
  ];
  emit();
  return id;
}

export function resolvePostUploading(uploadingId, post = null) {
  state.uploadingCards = state.uploadingCards.filter(
    (item) => item.id !== uploadingId,
  );

  if (post?.id) {
    state.finishedPosts = [post, ...state.finishedPosts];
  }

  emit();
}

export function rejectPostUploading(uploadingId) {
  state.uploadingCards = state.uploadingCards.filter(
    (item) => item.id !== uploadingId,
  );
  emit();
}

export function consumeFinishedUploadedPosts() {
  if (!state.finishedPosts.length) {
    return [];
  }

  const posts = [...state.finishedPosts];
  state.finishedPosts = [];
  emit();
  return posts;
}
