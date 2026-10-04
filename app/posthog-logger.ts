"use client";

import posthog from "posthog-js";

const isPostHogConfigured =
  Boolean(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN) &&
  Boolean(process.env.NEXT_PUBLIC_POSTHOG_HOST);

function info(body: string, attributes?: Record<string, string>) {
  if (isPostHogConfigured) {
    posthog.logger.info(body, attributes);
  }
}

export const posthogAppLogger = {
  destinationOpened(destinationType: "internal" | "external") {
    info("destination opened", { destination_type: destinationType });
  },
  battleStarted() {
    info("battle started");
  },
  battleCompleted(winner: "oregon_duck" | "mariners_moose") {
    info("battle completed", { winner });
  },
};
