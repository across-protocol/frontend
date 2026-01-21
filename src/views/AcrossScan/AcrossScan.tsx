import { LayoutV2 } from "../../components";
import { AllTransactions } from "./components/AllTransactions";
import BreadcrumbV2 from "../../components/BreadcrumbV2";

export const AcrossScan = () => {
  return (
    <LayoutV2 maxWidth={1140}>
      <BreadcrumbV2 />
      <AllTransactions />
    </LayoutV2>
  );
};
