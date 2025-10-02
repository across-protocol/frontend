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
    background-color: none;
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
