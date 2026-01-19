import { LayoutV2 } from "../../components";
import { AllTransactions } from "./components/AllTransactions";

export const AcrossScan = () => {
  return (
    <LayoutV2 maxWidth={1140}>
      <div>ACROSS SCAN</div>
      <AllTransactions></AllTransactions>
    </LayoutV2>
  );
};
