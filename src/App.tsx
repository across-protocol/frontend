import { BrowserRouter as Router } from "react-router-dom";
import { Types } from "@amplitude/analytics-browser";
import { ampli } from "./ampli";
import Routes from "./Routes";
import { amplitudeEnvironment, isProductionBuild } from "utils";

// Record an event when the application is loaded
ampli.load({
  environment: amplitudeEnvironment,
  client: {
    configuration: {
      disableCookies: true,
      logLevel: isProductionBuild ? Types.LogLevel.Error : Types.LogLevel.Debug,
      trackingOptions: {
        ipAddress: false,
        carrier: false,
        city: false,
        region: false,
        dma: false, // designated market area
      },
    },
  },
});
ampli.applicationLoaded();

function App() {
  return (
    <Router>
      <Routes />
    </Router>
  );
}
export default App;
