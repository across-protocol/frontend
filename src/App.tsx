import { ampli } from "./ampli";
import { BrowserRouter as Router } from "react-router-dom";
import Routes from "./Routes";
import { amplitudeAPIKey, amplitudeEnvironment } from "utils";

console.log(process.env.REACT_APP_VERSION);

// Record an event when the application is loaded
ampli.load({
  environment: amplitudeEnvironment,
  client: {
    apiKey: amplitudeAPIKey || "",
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
