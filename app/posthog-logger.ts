"use client";

import posthog from "posthog-js";
import { isPostHogEnabled } from "./posthog-provider";

function info(body: string, attributes?: Record<string, string>) {
  if (isPostHogEnabled) {
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
