import { useConnection } from "./useConnection";
import {
  getPMFGoogleFormEntered,
  setPMFGoogleFormEntered,
} from "utils/localStorage";
import { useCallback, useMemo } from "react";
import { pmfSurveyGFormUrl } from "utils";
import { useAmpliTracking } from "./useAmpliTracking";
import { ampli } from "ampli";

export function usePMFForm() {
  const { account } = useConnection();
  const { addToQueue: addToAmpliQueue } = useAmpliTracking(true);

  const isPMFormAvailable = useMemo(() => {
    const isPMFGoogleFormEntered = getPMFGoogleFormEntered();
    return !!pmfSurveyGFormUrl && !isPMFGoogleFormEntered && !!account;
  }, [account]);

  const handleNavigateToPMFGoogleForm = useCallback(() => {
    if (!isPMFormAvailable) {
      return;
    }
    addToAmpliQueue(() => {
      ampli.pmfButtonClicked({
        page: "depositStatusPage",
      });
    });
    setPMFGoogleFormEntered();
    const url = `${pmfSurveyGFormUrl}${account}`;
    window.open(url, "_blank");
  }, [isPMFormAvailable, addToAmpliQueue, account]);

  return {
    isPMFormAvailable,
    handleNavigateToPMFGoogleForm,
  };
}
