import { ComponentStory, ComponentMeta } from "@storybook/react";
import Alert from "components/Alert";

export default {
  title: "Alert",
  component: Alert,
  argTypes: {},
} as ComponentMeta<typeof Alert>;

const Template: ComponentStory<typeof Alert> = (args) => {
  return <Alert status="warn">{args.children}</Alert>;
};

export const Default = Template.bind({});
Default.args = {
  children: <div>This is a warning</div>,
};
