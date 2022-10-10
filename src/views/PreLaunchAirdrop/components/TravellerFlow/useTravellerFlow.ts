import React, { useState } from "react";
import { Rotate, Bolt, Heart, Present } from "./TravellerFlow.styles";
import { useHistory } from "react-router-dom";
const TRAVELLER_FLOW_DATA: {
  title: string;
  Icon: React.FC;
  description: string | (string | { val: string; href?: string })[];
}[] = [
  {
    title: "Welcome, Bridge Traveler.",
    Icon: Rotate,
    description:
      "Hello. We detect that you’ve traveled far from home. Welcome to Across.",
  },
  {
    title: "Our Offerings",
    Icon: Bolt,
    description: [
      "Our realm offers lighting-fast transfers, astonishingly low fees and protection by ",
      {
        val: "UMA's Optimistic Oracle",
        href: "https://umaproject.org/products/optimistic-oracle",
      },
      ". Learn more about Across ",
      { val: "here", href: "/about" },
      ".",
    ],
  },
  {
    title: "Reserve Your Gift",
    Icon: Present,
    description:
      "We’ve prepared a welcome gift for you! It awaits your arrival. Let us show you the way.",
  },
  {
    title: "Go Forth And Bridge",
    Icon: Heart,
    description:
      "This portal (button) will bring you to the bridge. You must complete a 0.1 ETH or 150 USDC transfer to receive your gift. Ready?",
  },
];
export default function useTravellerFlow() {
  const [step, setStep] = useState(1);
  const history = useHistory();
  return { step, setStep, view: TRAVELLER_FLOW_DATA[step - 1], history };
}
