import { useCallback, useState } from "react";

type CopyState = {
  isCopying: boolean;
  success: boolean | null;
  error: string | null;
};

type CopyToClipboardOptions = {
  onSuccess?: () => void;
  onError?: (error: string) => void;
};

type CopyItem = {
  content: string;
  remote?: boolean;
};

export function useCopyToClipboard(options?: CopyToClipboardOptions) {
  const [copyState, setCopyState] = useState<CopyState>({
    isCopying: false,
    success: null,
    error: null,
  });

  const copyToClipboard = useCallback(
    async (items: CopyItem[]): Promise<boolean> => {
      setCopyState({
        isCopying: true,
        success: null,
        error: null,
      });

      try {
        // Check if clipboard API is supported
        if (!navigator.clipboard || !navigator.clipboard.write) {
          throw new Error("Clipboard API not supported");
        }
        // https://developer.mozilla.org/en-US/docs/Web/API/ClipboardItem#constructor
        const clipboardItems: Record<string, Blob> = {}; // MIME type as key, Blob as value
        const textParts: string[] = [];

        for (const item of items) {
          // if content is remote, fetch it, store as blob
          if (item.remote) {
            try {
              const response = await fetch(item.content);
              if (!response.ok) {
                throw new Error(
                  `Failed to fetch remote content: ${response.statusText}`
                );
              }

              const blob = await response.blob();
              clipboardItems[blob.type] = blob;
            } catch (fetchError) {
              // If remote fetch fails, add as text fallback
              // TODO: validate this behaviour is what we want
              textParts.push(item.content);
            }
          } else {
            textParts.push(item.content);
          }
        }

        // Combine all plan text content separated by newline.
        if (textParts.length > 0) {
          const combinedText = textParts.join("\n");
          clipboardItems["text/plain"] = new Blob([combinedText], {
            type: "text/plain",
          });
        }

        await navigator.clipboard.write([new ClipboardItem(clipboardItems)]);

        setCopyState({
          isCopying: false,
          success: true,
          error: null,
        });

        options?.onSuccess?.();
        return true;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";

        setCopyState({
          isCopying: false,
          success: false,
          error: `Copy failed: ${errorMessage}.`,
        });

        options?.onError?.(errorMessage);
        return false;
      }
    },
    [options]
  );

  const resetState = useCallback(() => {
    setCopyState({
      isCopying: false,
      success: null,
      error: null,
    });
  }, []);

  return {
    copyToClipboard,
    resetState,
    ...copyState,
  };
}
