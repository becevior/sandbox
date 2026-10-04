"use client";

import posthog from "posthog-js";
import type { ReactNode } from "react";

const projectToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
// Proxied through our own domain via the /ingest rewrites in next.config.mjs.
const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "/ingest";

// Only send analytics from deployed builds, never from the local dev server.
export const isPostHogEnabled =
  Boolean(projectToken) && process.env.NODE_ENV === "production";

if (isPostHogEnabled && typeof window !== "undefined") {
  posthog.init(projectToken!, {
    api_host: host,
    ui_host: "https://us.posthog.com",
    defaults: "2026-05-30",
    capture_exceptions: true,
  });
}

export function PostHogProvider({ children }: { children: ReactNode }) {
  return children;
}
