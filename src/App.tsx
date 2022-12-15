import { ampli } from "./ampli";
import { BrowserRouter as Router } from "react-router-dom";
import Routes from "./Routes";

// Record an event when the application is loaded
ampli.load({
  environment: "production", // Since we are proxying the API, we need to set the environment manually
  client: {
    apiKey: "ACX_PLACEHOLDER_API_KEY", // Since we are proxying the API, we need to set the API key manually
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
