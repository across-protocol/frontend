import { BrowserRouter as Router } from "react-router-dom";
import { Types } from "@amplitude/analytics-browser";
import { createInstance } from "@amplitude/marketing-analytics-browser";
import { ampli } from "./ampli";
import Routes from "./Routes";
import {
  amplitudeAPIKey,
  isAmplitudeLoggingEnabled,
  isProductionBuild,
} from "utils";

if (amplitudeAPIKey) {
  const instance = createInstance();
  instance.init(amplitudeAPIKey, undefined, {
    disableCookies: true,
    logLevel:
      isProductionBuild || !isAmplitudeLoggingEnabled
        ? Types.LogLevel.Error
        : Types.LogLevel.Debug,
    trackingOptions: {
      ipAddress: false,
      carrier: false,
      city: false,
      region: false,
      dma: false, // designated market area
    },
    attribution: {
      disabled: !Boolean(amplitudeAPIKey),
    },
  });
  ampli.load({
    client: { instance },
    environment: isProductionBuild ? "production" : "development",
  });
}
// Record an event when the application is loaded
ampli.applicationLoaded();

function App() {
  return (
    <Router>
      <Routes />
    </Router>
  );
}
export default App;
