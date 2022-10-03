import { useState } from "react";
import { ComponentStory, ComponentMeta } from "@storybook/react";
import DotStepper from "components/DotStepper";
import { ButtonV2 } from "components";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: "DotStepper",
  component: DotStepper,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {
    type: {
      values: ["default", "big"],
      control: {
        type: "radio",
      },
    },
  },
} as ComponentMeta<typeof DotStepper>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template: ComponentStory<typeof DotStepper> = (args) => {
  const [step, setStep] = useState(args.step);
  const styles = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: "200px",
    height: "60px",
  };
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={styles}>
        <DotStepper numDots={args.numDots} step={step} />
      </div>
      <div>
        <ButtonV2
          size="md"
          onClick={() =>
            setStep((pv) => (pv >= args.numDots ? args.numDots : pv + 1))
          }
        >
          Increment
        </ButtonV2>
        <ButtonV2
          size="md"
          onClick={() => setStep((pv) => (pv <= 1 ? 1 : pv - 1))}
        >
          Decrement
        </ButtonV2>
      </div>
    </div>
  );
};

export const Default = Template.bind({});
// More on args: https://storybook.js.org/docs/react/writing-stories/args
Default.args = {
  numDots: 4,
  step: 1,
};
