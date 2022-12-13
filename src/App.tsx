import { BrowserRouter as Router } from "react-router-dom";
import { getAmplitudeLogger } from "utils/amplitude";
import Routes from "./Routes";

getAmplitudeLogger();

function App() {
  return (
    <Router>
      <Routes />
    </Router>
  );
}
export default App;
