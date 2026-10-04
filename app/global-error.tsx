"use client";

import NextError from "next/error";
import posthog from "posthog-js";
import { useEffect } from "react";
import { isPostHogEnabled } from "./posthog-provider";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (isPostHogEnabled) {
      posthog.captureException(error);
    }
  }, [error]);

  return (
    <html lang="en">
      <body>
        <NextError statusCode={0} />
        <button onClick={reset} type="button">
          Try again
        </button>
      </body>
    </html>
  );
}
