export function readStoredArray(key, fallback) {
  try {
    const savedValue = localStorage.getItem(key);
    if (!savedValue) return fallback;
    const parsedValue = JSON.parse(savedValue);
    return Array.isArray(parsedValue) ? parsedValue : fallback;
  } catch (error) {
    console.error(`Failed to read ${key}:`, error);
    return fallback;
  }
}

export function writeStoredValue(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Failed to save ${key} to localStorage:`, error);
  }
}