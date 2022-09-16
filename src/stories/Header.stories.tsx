import { useState } from "react";
import { ComponentStory, ComponentMeta } from "@storybook/react";
import { Header, Sidebar } from "components";
// import { OnboardContext, OnboardProvider } from "hooks/useOnboard";
// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: "Header",
  component: Header,
  decorators: [],
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
const Template: ComponentStory<typeof Header> = (args) => {
  const [openSidebar, setOpenSidebar] = useState(false);
  return (
    <div>
      <Header
        {...args}
        openSidebar={openSidebar}
        setOpenSidebar={setOpenSidebar}
      />
      <Sidebar openSidebar={openSidebar} setOpenSidebar={setOpenSidebar} />
    </div>
  );
};

export const Default = Template.bind({});
// More on args: https://storybook.js.org/docs/react/writing-stories/args
Default.args = {};
