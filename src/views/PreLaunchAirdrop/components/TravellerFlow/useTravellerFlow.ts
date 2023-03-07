import { useState } from "react";
import { useHistory } from "react-router-dom";
export default function useTravellerFlow() {
  const [step, setStep] = useState(1);
  const history = useHistory();
  return { step, setStep, history };
}
