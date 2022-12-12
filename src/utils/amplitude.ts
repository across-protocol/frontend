import * as amplitude from "@amplitude/analytics-browser";
import { amplitudeAPIKey } from "./constants";

export enum AmplitudeEvent {
  BUTTON_CLICKED = "Button Clicked",
}

export function isAmplitudeEnabled() {
  return Boolean(amplitudeAPIKey);
}

export function initAmplitude() {
  if (!isAmplitudeEnabled()) return;
  amplitude.init(amplitudeAPIKey!);
}

initAmplitude();
amplitude.track(AmplitudeEvent.BUTTON_CLICKED);
