import assert from "assert";
import { matomoUrl } from "utils";
import MatomoTracker, { types } from "@datapunt/matomo-tracker-js";

let tracker: MatomoTracker | undefined;

export function trackerEnabled(): boolean {
  return Boolean(matomoUrl);
}
export function getTracker(): MatomoTracker {
  assert(trackerEnabled(), "Tracker is disabled, provide matomo url to enable");
  assert(matomoUrl, "Matomo url is not defined");
  if (tracker) return tracker;
  tracker = new MatomoTracker({
    urlBase: matomoUrl,
    siteId: 1,
    linkTracking: true,
    trackerUrl: matomoUrl + "matomo.php",
  });
  // Load the event listeners
  tracker.trackEvents();
  // Track page views
  tracker.trackPageView();
  return tracker;
}
export function trackEvent(params: types.TrackEventParams) {
  if (!trackerEnabled()) return;
  const tracker = getTracker();
  tracker.trackEvent(params);
}
export function trackPageView(params: types.TrackPageViewParams) {
  if (!trackerEnabled()) return;
  const tracker = getTracker();
  tracker.trackPageView(params);
}
export function trackLink(params: types.TrackLinkParams) {
  if (!trackerEnabled()) return;
  const tracker = getTracker();
  tracker.trackLink(params);
}
