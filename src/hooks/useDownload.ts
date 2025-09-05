import { useCallback } from "react";

export function useDownload(targetUrl: string, fileName?: string) {
  const handleDownload = useCallback(async () => {
    try {
      const response = await fetch(targetUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`);
      }

      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = objectUrl;

      if (!fileName) {
        // Open in new tab if no filename provided
        link.target = "_blank";
      } else {
        link.download = fileName;
      }

      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(objectUrl);

      return true;
    } catch (error) {
      console.error("Download failed:", error);
      return false;
    }
  }, [targetUrl, fileName]);

  return handleDownload;
}
