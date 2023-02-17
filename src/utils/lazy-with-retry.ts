import { lazy } from "react";

const HAS_REFRESHED_KEY = "retry-lazy-refreshed";

export default function lazyWithRetry(
  componentImport: Parameters<typeof lazy>[0]
) {
  // @ts-ignore
  return lazy(async () => {
    const hasRefreshed = JSON.parse(
      window.localStorage.getItem(HAS_REFRESHED_KEY) || "false"
    );

    try {
      const component = await componentImport();

      window.localStorage.setItem(HAS_REFRESHED_KEY, "false");

      return component;
    } catch (error) {
      if (!hasRefreshed) {
        // Assuming that the user is not on the latest version of the application.
        // Let's refresh the page immediately.
        window.localStorage.setItem(HAS_REFRESHED_KEY, "true");
        return window.location.reload();
      }

      // The page has already been reloaded
      // Assuming that user is already using the latest version of the application.
      // Let's let the application crash and raise the error.
      throw error;
    }
  });
}
