import { ComponentStory, ComponentMeta } from "@storybook/react";
import BouncingDotsLoader from "components/BouncingDotsLoader";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: "BouncingDotsLoader",
  component: BouncingDotsLoader,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {
    type: {
      values: ["default", "big"],
      control: {
        type: "radio",
      },
    },
  },
} as ComponentMeta<typeof BouncingDotsLoader>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template: ComponentStory<typeof BouncingDotsLoader> = (args) => {
  const styles = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: "200px",
    height: "60px",
    backgroundColor: "green",
  };
  return (
    <div style={styles}>
      <BouncingDotsLoader {...args} />
    </div>
  );
};

export const Default = Template.bind({});
// More on args: https://storybook.js.org/docs/react/writing-stories/args
Default.args = {};

export const WhiteIcons = Template.bind({});
WhiteIcons.args = {
  whiteIcons: true,
};
