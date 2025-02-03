import { TextEncoder, TextDecoder } from "util";
global.TextEncoder = TextEncoder;
// @ts-expect-error - The types are incompatible but the implementation works correctly
global.TextDecoder = TextDecoder;
