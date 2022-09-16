import { useState, useEffect } from "react";
import { ComponentStory, ComponentMeta } from "@storybook/react";
import { Header, Sidebar } from "components";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: "Header",
  component: Header,
  decorators: [],
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {
    openSidebar: {
      control: {
        type: "boolean",
      },
      defaultValue: false,
    },
    setOpenSidebar: {
      control: {
        type: null,
      },
    },
  },
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
  useEffect(() => {
    setOpenSidebar(args.openSidebar);
  }, [args.openSidebar]);

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
