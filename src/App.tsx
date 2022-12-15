import { ampli } from "./ampli";
import { BrowserRouter as Router } from "react-router-dom";
import Routes from "./Routes";

console.log(window.location.origin);

// Record an event when the application is loaded
ampli.load({
  environment: amplitudeEnvironment,
  client: {
    apiKey: "ACX_PLACEHOLDER_API_KEY",
    configuration: {
      serverUrl: `${window.location.origin}/api/instrumentation`,
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
