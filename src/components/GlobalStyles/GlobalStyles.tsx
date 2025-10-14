import { Global, css } from "@emotion/react";
import { reset } from "./reset";

export const typography = css`
  /* only take latin chars to reduce bundle size */
  @font-face {
    font-family: "Barlow";
    font-style: normal;
    font-weight: 400;
    font-display: fallback;
    src: url("/fonts/Barlow-Regular.woff2") format("woff2");
    unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6,
      U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193,
      U+2212, U+2215, U+FEFF, U+FFFD;
  }
  @font-face {
    font-family: "Barlow";
    font-style: normal;
    font-weight: 500;
    font-display: fallback;
    src: url("/fonts/Barlow-Medium.woff2") format("woff2");
    unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6,
      U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193,
      U+2212, U+2215, U+FEFF, U+FFFD;
  }
  @font-face {
    font-family: "Barlow";
    font-style: normal;
    font-weight: 700;
    font-display: fallback;
    src: url("/fonts/Barlow-Bold.woff2") format("woff2");
    unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6,
      U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193,
      U+2212, U+2215, U+FEFF, U+FFFD;
  }
`;
const variables = css`
  :root {
    --color-interface-red: #f96c6c;

    --color-interface-yellow: #f9d26c;

    --color-interface-op-red: #f96c6c;
    --color-interface-op-red-5: #f96c6c0d;
    --color-interface-op-red-15: #f96c6c26;

    --color-interface-arb-blue: #28a0f0;
    --color-interface-arb-blue-5: #28a0f026;
    --color-interface-arb-blue-15: #28a0f026;

    --color-brand-aqua: #6cf9d8;
    --color-interface-aqua: #6cf9d8;
    --color-interface-aqua-0: #6cf9d800;
    --color-interface-aqua-5: #6cf9d80d;
    --color-interface-aqua-15: #6cf9d826;

    --color-interface-teal: #44d2ff;
    --color-interface-teal-0: #44d2ff00;
    --color-interface-teal-5: #44d2ff0d;
    --color-interface-teal-15: #44d2ff26;

    --color-interface-white: #ffffff;

    --color-neutrals-black-700: #34353b;
    --color-neutrals-black-800: #2d2e33;
    --color-neutrals-black-900: #202024;

    --color-neutrals-grey-400: #9daab3;
    --color-neutrals-grey-400-15: #9daab326;
    --color-neutrals-grey-400-5: #9daab30d;

    --color-neutrals-grey-500: #4c4e57;
    --color-neutrals-grey-600: #3e4047;
    --color-neutrals-grey-650: #393a40;

    --color-neutrals-light-100: #ffffff;
    --color-neutrals-light-200: #e0f3ff;
    --color-neutrals-light-300: #c5d5e0;

    --color-neutrals-blue-200: #1da1f2;

    --tints-shades-white-70: #9daab2;
    --tints-shades-white-88: #c5d5e0;
    --tints-shades-white-100: #e0f3ff;
    --tints-shades-white-200: #9daab2;

    /* Color tokens (from Figma) */
    --base-aqua: var(--shades-aqua-aqua-300);
    --base-bright-gray: var(--shades-neutrals-neutral-100);
    --base-dark-gray: var(--shades-neutrals-neutral-800);
    --functional-blue: #47a8ff;
    --functional-red: #ff6166;
    --functional-yellow: #ff9500;
    --shades-aqua-aqua-100: #bdfced;
    --shades-aqua-aqua-200: #98fbe4;
    --shades-aqua-aqua-300: #6cf9d8;
    --shades-aqua-aqua-400: #66e5c7;
    --shades-aqua-aqua-500: #59bca6;
    --shades-aqua-aqua-600: #4d9385;
    --shades-aqua-aqua-700: #406b65;
    --shades-aqua-aqua-800: #3a5754;
    --shades-aqua-aqua-900: #334244;
    --shades-neutrals-neutral-000: #ffffff;
    --shades-neutrals-neutral-100: #e0f3ff;
    --shades-neutrals-neutral-200: #cedfeb;
    --shades-neutrals-neutral-300: #aab8c2;
    --shades-neutrals-neutral-400: #869099;
    --shades-neutrals-neutral-500: #636970;
    --shades-neutrals-neutral-600: #51555c;
    --shades-neutrals-neutral-700: #3f4247;
    --shades-neutrals-neutral-800: #2d2e33;
    --shades-neutrals-neutral-850: #34353b;
    --shades-neutrals-neutral-900: #202024;
    --transparency-aqua-aqua-10: #6cf9d81a;
    --transparency-aqua-aqua-20: #6cf9d833;
    --transparency-aqua-aqua-30: #6cf9d84d;
    --transparency-aqua-aqua-40: #6cf9d866;
    --transparency-aqua-aqua-5: #6cf9d80d;
    --transparency-aqua-aqua-50: #6cf9d880;
    --transparency-aqua-aqua-60: #6cf9d899;
    --transparency-aqua-aqua-70: #6cf9d8b2;
    --transparency-aqua-aqua-80: #6cf9d8cc;
    --transparency-aqua-aqua-90: #6cf9d8e5;
    --transparency-bright-gray-bright-gray-10: #e0f3ff1a;
    --transparency-bright-gray-bright-gray-20: #e0f3ff33;
    --transparency-bright-gray-bright-gray-30: #e0f3ff4d;
    --transparency-bright-gray-bright-gray-40: #e0f3ff66;
    --transparency-bright-gray-bright-gray-5: #e0f3ff0d;
    --transparency-bright-gray-bright-gray-50: #e0f3ff80;
    --transparency-bright-gray-bright-gray-60: #e0f3ff99;
    --transparency-bright-gray-bright-gray-70: #e0f3ffb2;
    --transparency-bright-gray-bright-gray-80: #e0f3ffcc;
    --transparency-bright-gray-bright-gray-90: #e0f3ffe5;
    --transparency-dark-gray-dark-gray-10: #2d2e331a;
    --transparency-dark-gray-dark-gray-20: #2d2e3333;
    --transparency-dark-gray-dark-gray-30: #2d2e334d;
    --transparency-dark-gray-dark-gray-40: #2d2e3366;
    --transparency-dark-gray-dark-gray-5: #2d2e330d;
    --transparency-dark-gray-dark-gray-50: #2d2e3380;
    --transparency-dark-gray-dark-gray-60: #2d2e3399;
    --transparency-dark-gray-dark-gray-70: #2d2e33b2;
    --transparency-dark-gray-dark-gray-80: #2d2e33cc;
    --transparency-dark-gray-dark-gray-90: #2d2e33e5;

    /* Spacing tokens (from Figma) */
    --corner-radius-none: 0px;
    --corner-radius-3x-small: 4px;
    --corner-radius-2x-small: 6px;
    --corner-radius-x-small: 8px;
    --corner-radius-small: 12px;
    --corner-radius-medium: 16px;
    --corner-radius-large: 24px;
    --corner-radius-x-large: 32px;
    --corner-radius-2x-large: 40px;
    --corner-radius-round: 999px;
    --spacing-none: 0px;
    --spacing-3x-small: 4px;
    --spacing-2x-small: 6px;
    --spacing-x-small: 8px;
    --spacing-small: 12px;
    --spacing-medium: 16px;
    --spacing-large: 24px;
    --spacing-x-large: 32px;
    --spacing-2x-large: 40px;
    --spacing-3x-large: 64px;
    --spacing-4x-large: 80px;
    --spacing-5x-large: 120px;

    /* Old variables kept until refactored */
    --color-primary: var(--color-interface-aqua);
    --color-gray: var(--color-neutrals-black-800);
    --color-black: var(--color-neutrals-black-900);
    --color-pagination: var(--color-neutrals-grey-500);
    --color-white: var(--color-interface-white);
    --color-error: var(--color-interface-red);
  }
`;

const globalStyles = css`
  ${reset};
  *,
  *:before,
  *:after {
    box-sizing: border-box;
    line-height: 1.5;
    font-family: "Barlow", "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: auto;
  }
  button {
    border: none;
    background: none;
    color: inherit;
    cursor: pointer;
  }
  html,
  body {
    min-height: 100vh;
  }
  body {
    background-color: var(--color-gray);
    color: var(--color-white);

    -webkit-font-smoothing: antialiased;
    -moz-font-smoothing: antialiased;
    -o-font-smoothing: antialiased;
  }
  #root {
    min-height: 100vh;
    isolation: isolate;
  }
  // iphone query
  @media screen and (-webkit-min-device-pixel-ratio: 2) {
    select,
    select:focus,
    textarea,
    textarea:focus,
    input,
    input:focus {
      font-size: 16px;
    }
  }

  ${typography}
  ${variables}
`;

const GlobalStyles = () => <Global styles={globalStyles} />;
export default GlobalStyles;
