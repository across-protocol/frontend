import { useEffect, useRef } from "react";
import useSound from "use-sound";

export type UseSoundEffectOptions = Parameters<typeof useSound>[1] & {
  stopOnUnmount?: boolean;
};

// useful for playing sound as a side effect
export function useSoundEffect(
  src: string,
  shouldPlay: boolean,
  options: UseSoundEffectOptions = {
    stopOnUnmount: false,
    volume: 0.5,
  }
) {
  const [play, { stop, sound }] = useSound(src, options);

  const hasPlayedRef = useRef(false);
  const soundRef = useRef<typeof sound>(null);

  // Track latest sound instance in a ref for unmount cleanup
  useEffect(() => {
    soundRef.current = sound;
  }, [sound]);

  useEffect(() => {
    if (shouldPlay && !hasPlayedRef.current) {
      play();
      hasPlayedRef.current = true;
    }
  }, [shouldPlay, play]);

  // Unmount cleanup only (optional)
  useEffect(() => {
    return () => {
      try {
        if (options.stopOnUnmount) {
          stop();
          if (soundRef.current) {
            soundRef.current.unload();
          }
        }
      } catch {
        // no-op
      }
    };
  }, [options.stopOnUnmount, stop]);
}
