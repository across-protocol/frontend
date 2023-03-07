import axios from "axios";
import MockAdapter from "axios-mock-adapter";

const isolatedAxiosInstance = axios.create();

// This sets the mock adapter on the default instance
export { isolatedAxiosInstance as axios };
export default new MockAdapter(isolatedAxiosInstance);
