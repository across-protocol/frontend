import { BrowserRouter as Router } from "react-router-dom";
import Routes from "./Routes";
import assert from "assert";

// App will have errors without these environment variables -- throw an error.
assert(
  process.env.REACT_APP_PUBLIC_ONBOARD_API_KEY,
  "REACT_APP_PUBLIC_ONBOARD_API_KEY must be defined."
);
assert(
  process.env.REACT_APP_PUBLIC_INFURA_ID,
  "REACT_APP_PUBLIC_INFURA_ID must be defined."
);

assert(
  process.env.REACT_APP_CHAIN_137_PROVIDER_URL,
  "REACT_APP_CHAIN_137_PROVIDER_URL must be defined."
);

assert(
  process.env.REACT_APP_CHAIN_42161_PROVIDER_URL,
  "REACT_APP_CHAIN_42161_PROVIDER_URL must be defined."
);

function App() {
  return (
    <Router>
      <Routes />
    </Router>
  );
}
export default App;
