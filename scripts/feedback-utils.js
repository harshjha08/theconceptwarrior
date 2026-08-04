(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  root.CWFeedbackUtils = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  const STORAGE_KEY = 'cw-local-feedbacks';
  const MAX_AGE_MS = 3 * 24 * 60 * 60 * 1000;

  function getStorage(storage) {
    if (storage) return storage;
    if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
    return null;
  }

  function normalizeText(value) {
    return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
  }

  function makeDedupeKey(data) {
    const nameKey = normalizeText(data.name || data.fullName || '');
    const emailKey = normalizeText(data.email || '');
    return nameKey || emailKey || 'anonymous';
  }

  function readStoredFeedbacks(storage) {
    const store = getStorage(storage);
    if (!store) return [];
    try {
      const parsed = JSON.parse(store.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.warn('Could not read feedbacks from storage:', error);
      return [];
    }
  }

  function pruneExpiredFeedbacks(items, now = Date.now()) {
    return items.filter((item) => (item.expiresAt || 0) > now);
  }

  function saveFeedbackLocally(data, now = Date.now(), storage) {
    const store = getStorage(storage);
    if (!store) return null;

    const entry = {
      ...data,
      name: String(data.name || '').trim(),
      rating: data.rating || '⭐⭐⭐⭐⭐',
      feedback: String(data.feedback || '').trim(),
      timestamp: new Date(now).toISOString(),
      expiresAt: now + MAX_AGE_MS,
      dedupeKey: makeDedupeKey(data)
    };

    const existing = pruneExpiredFeedbacks(readStoredFeedbacks(store), now);
    const filtered = existing.filter((item) => item.dedupeKey !== entry.dedupeKey);
    filtered.unshift(entry);
    store.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return entry;
  }

  function getActiveFeedbacks(now = Date.now(), storage) {
    return pruneExpiredFeedbacks(readStoredFeedbacks(storage), now);
  }

  return {
    STORAGE_KEY,
    MAX_AGE_MS,
    saveFeedbackLocally,
    getActiveFeedbacks,
    makeDedupeKey
  };
});
