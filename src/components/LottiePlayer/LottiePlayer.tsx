import React from "react";
import Lottie from "react-lottie";

type LottieParams = {
  animationData: Record<string, any>;
  autoplay?: boolean;
  loop?: boolean;
  height?: number;
  width?: number;
};

const LottiePlayer = ({
  animationData,
  autoplay,
  loop,
  height,
  width,
}: LottieParams) => (
  <Lottie
    options={{
      animationData,
      autoplay: autoplay ?? false,
      loop: loop ?? false,
    }}
    height={height}
    width={width}
  ></Lottie>
);

export default React.memo(LottiePlayer);
