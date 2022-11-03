import { ComponentStory, ComponentMeta } from "@storybook/react";
import BouncingDotsLoader from "components/BouncingDotsLoader";

export default {
  title: "BouncingDotsLoader",
  component: BouncingDotsLoader,
  argTypes: {
    type: {
      values: ["default", "big"],
      control: {
        type: "radio",
      },
    },
  },
} as ComponentMeta<typeof BouncingDotsLoader>;

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
Default.args = {};

export const WhiteIcons = Template.bind({});
WhiteIcons.args = {
  dotColor: "white",
};
