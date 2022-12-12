import { BrowserRouter as Router } from "react-router-dom";
import { initAmplitude } from "utils/amplitude";
import Routes from "./Routes";

initAmplitude();

function App() {
  return (
    <Router>
      <Routes />
    </Router>
  );
}
export default App;
