/**
 * Hand-written stand-ins for a browser that refuses `localStorage`, for tests
 * of code that must keep working without it (the guest deck, I-39).
 *
 * Each one replaces `window.localStorage` through a property descriptor on
 * jsdom's `window`; `restoreBrowserStorage` puts jsdom's own storage back and
 * must run after each test that used one.
 *
 * @module test/browser-storage
 */

const jsdomStorageDescriptor = Object.getOwnPropertyDescriptor(
  window,
  "localStorage"
);

function replaceStorage(get: () => Storage): void {
  Object.defineProperty(window, "localStorage", { configurable: true, get });
}

/**
 * Makes every read of `window.localStorage` throw a `SecurityError`, as a
 * browser does when site data is blocked (third-party or "block all cookies"
 * settings, some embedded views).
 */
export function blockBrowserStorage(): void {
  replaceStorage(() => {
    throw new DOMException("Site data is blocked", "SecurityError");
  });
}

/**
 * Replaces `window.localStorage` with a storage that reads and removes but
 * throws a `QuotaExceededError` on every `setItem`, as a full quota or some
 * private modes do.
 *
 * @param saved - the items the storage already holds, by key
 */
export function fillBrowserStorageQuota(
  saved: Readonly<Record<string, string>> = {}
): void {
  const items = new Map(Object.entries(saved));
  const fullStorage: Storage = {
    get length() {
      return items.size;
    },
    key: (index) => [...items.keys()][index] ?? null,
    getItem: (key) => items.get(key) ?? null,
    setItem: () => {
      throw new DOMException(
        "The quota has been exceeded",
        "QuotaExceededError"
      );
    },
    removeItem: (key) => {
      items.delete(key);
    },
    clear: () => {
      items.clear();
    },
  };
  replaceStorage(() => fullStorage);
}

/** Puts jsdom's own `window.localStorage` back after a stand-in replaced it. */
export function restoreBrowserStorage(): void {
  if (jsdomStorageDescriptor) {
    Object.defineProperty(window, "localStorage", jsdomStorageDescriptor);
    return;
  }
  Reflect.deleteProperty(window, "localStorage");
}
