import React from "react";
import { ComponentStory, ComponentMeta } from "@storybook/react";
import { withRouter } from "storybook-addon-react-router-v6";
import { Header } from "components";
import { withReactContext } from "storybook-react-context";
import { OnboardContext, OnboardProvider } from "hooks/useOnboard";
// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: "Header",
  component: Header,
  decorators: [
    withRouter,
    // withReactContext({
    //   Context: OnboardContext,
    // }),
  ],
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {},
  parameters: {
    reactRouter: {
      routePath: "/",
      routeParams: {},
    },
  },
} as ComponentMeta<typeof Header>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template: ComponentStory<typeof Header> = (args) => <Header {...args} />;

export const Default = Template.bind({});
// More on args: https://storybook.js.org/docs/react/writing-stories/args
Default.args = {
  openSidebar: false,
  setOpenSidebar: (pv) => {
    return !pv;
  },
};
