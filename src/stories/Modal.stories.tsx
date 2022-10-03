import { ComponentStory, ComponentMeta } from "@storybook/react";
import Modal from "components/Modal";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: "Modal",
  component: Modal,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {
    width: {
      options: [200, 500, undefined],
      control: { type: "radio" },
    },
    height: {
      control: {
        type: null,
      },
    },
  },
} as ComponentMeta<typeof Modal>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template: ComponentStory<typeof Modal> = (args) => {
  return (
    <Modal
      {...args}
      title={args.title || "Basic Modal"}
      exitModalHandler={() => null}
    >
      {args.children || <div>Main Body</div>}
    </Modal>
  );
};

export const Default = Template.bind({});
// More on args: https://storybook.js.org/docs/react/writing-stories/args
Default.args = {};

export const Width = Template.bind({});
Width.args = {
  title: "Width demo",
  width: 400,
  children: <div>Bigger Width</div>,
};

export const TopVerticalLocation = Template.bind({});
TopVerticalLocation.args = {
  title: "Vertical Demo",
  verticalLocation: { desktop: "top", tablet: "top", mobile: "top" },
  children: <div>On Top</div>,
};

export const BottomVerticalLocation = Template.bind({});
BottomVerticalLocation.args = {
  title: "Vertical Demo",
  verticalLocation: { desktop: "bottom", tablet: "bottom", mobile: "bottom" },
  children: <div>On Bottom</div>,
};
