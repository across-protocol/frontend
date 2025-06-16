import { useConnection } from "./useConnection";
import {
  getPMFGoogleFormEntered,
  setPMFGoogleFormEntered,
} from "utils/localStorage";
import { useCallback } from "react";
import { pmfSurveyGFormUrl } from "utils";

export function usePMFForm() {
  const { account } = useConnection();
  const isPMFGoogleFormEntered = getPMFGoogleFormEntered();
  const isPMFormAvailable =
    !!pmfSurveyGFormUrl && !isPMFGoogleFormEntered && !!account;

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
