import { useConnection } from "./useConnection";
import {
  getPMFGoogleFormEntered,
  setPMFGoogleFormEntered,
} from "utils/localStorage";
import { useCallback, useMemo } from "react";
import { pmfSurveyGFormUrl } from "utils";

export function usePMFForm() {
  const { account } = useConnection();

  const isPMFormAvailable = useMemo(() => {
    const isPMFGoogleFormEntered = getPMFGoogleFormEntered();
    return !!pmfSurveyGFormUrl && !isPMFGoogleFormEntered && !!account;
  }, [account]);

  const handleNavigateToPMFGoogleForm = useCallback(() => {
    if (!isPMFormAvailable) {
      return;
    }
    setPMFGoogleFormEntered();
    const url = `${pmfSurveyGFormUrl}${account}`;
    window.open(url, "_blank");
  }, [isPMFormAvailable, account]);

  return {
    isPMFormAvailable,
    handleNavigateToPMFGoogleForm,
  };
}
