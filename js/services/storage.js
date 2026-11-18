// Small localStorage adapter used by demo mode.
const PREFIX = "cloudstock:";
export const storage = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (error) {
      console.warn("CloudStock storage read failed:", error);
      return fallback;
    }
  },
  set(key, value) {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
    return value;
  },
  remove(key) {
    localStorage.removeItem(PREFIX + key);
  }
};
