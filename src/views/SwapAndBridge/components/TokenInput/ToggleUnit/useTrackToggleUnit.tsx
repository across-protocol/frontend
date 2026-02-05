import { useAmplitude } from "hooks/useAmplitude";
import { ampli } from "../../../../../ampli";

export function useTrackToggleUnit() {
  const { addToAmpliQueue } = useAmplitude();
  return () =>
    addToAmpliQueue(() => {
      ampli.changeUnitsButtonClicked({
        action: "onClick",
        element: "changeUnitsButton",
        page: "swapPage",
        section: "bridgeForm",
      });
    });
}
