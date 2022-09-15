import { useState } from "react";
export default function useTravellerFlow() {
  const [step, setStep] = useState(1);
  return { step, setStep };
}
