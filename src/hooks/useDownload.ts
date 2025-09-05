import { useCallback } from "react";

export function useDownload(url: string, filename: string) {
  const download = useCallback(async () => {
    try {
      // Fetch the file
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }

      const blob = await response.blob();

      const objectUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = filename;

      document.body.appendChild(link);
      link.click();

      // clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error("Download failed:", error);
      // Fallback: open image in new tab
      window.open(url, "_blank");
    }
  }, [url, filename]);

  return download;
}
