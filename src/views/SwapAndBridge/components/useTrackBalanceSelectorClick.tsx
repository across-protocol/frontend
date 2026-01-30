import { useAmplitude } from "hooks/useAmplitude";
import { ampli } from "../../../ampli";
import { BalanceSelectorPercentage } from "./BalanceSelector";

export const useTrackBalanceSelectorClick = () => {
  const { addToAmpliQueue } = useAmplitude();
  return (percentage: BalanceSelectorPercentage) => {
    let percentValue: "25" | "50" | "75" | "100";

    switch (percentage) {
      case "MAX":
        percentValue = "100";
        break;
      case "25%":
        percentValue = "25";
        break;
      case "50%":
        percentValue = "50";
        break;
      case "75%":
        percentValue = "75";
        break;
    }
    addToAmpliQueue(() => {
      ampli.inputAmountPercentClicked({
        percent: percentValue,
      });
    });
  };
};
