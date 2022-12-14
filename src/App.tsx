import { BrowserRouter as Router } from "react-router-dom";
import { getAmplitudeLogger } from "utils/amplitude";
import { AmplitudeEvent } from "utils/amplitude/types";
import Routes from "./Routes";

// Record an event when the application is loaded
getAmplitudeLogger().recordEvent({
  event: AmplitudeEvent.ApplicationLoaded,
  payload: {},
});

function App() {
  return (
    <Router>
      <Routes />
    </Router>
  );
}
export default App;
