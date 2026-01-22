import { useState, useEffect, ImgHTMLAttributes } from "react";
import fallbackLogo from "assets/token-logos/fallback.svg";

type TokenImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  src?: string;
  alt: string;
};

/**
 * TokenImage component that handles missing or broken token logo URLs
 * Falls back to a default logo if the URL is missing or the image fails to load
 */
export function TokenImage({ src, alt, ...props }: TokenImageProps) {
  const [imageError, setImageError] = useState(false);

  // Reset error state when src changes
  useEffect(() => {
    setImageError(false);
  }, [src]);

  const imageSrc = !src || imageError ? fallbackLogo : src;

  return (
    <img
      {...props}
      src={imageSrc}
      alt={alt}
      onError={() => setImageError(true)}
    />
  );
}
