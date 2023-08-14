import axios from "axios";
import MockAdapter from "axios-mock-adapter";

const isolatedAxiosInstance = axios.create();
const mockAdapter = new MockAdapter(isolatedAxiosInstance);

// This sets the mock adapter on the default instance
export { isolatedAxiosInstance as axios };
export default mockAdapter;
