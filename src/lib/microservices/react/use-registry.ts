"use client";

import { getService } from "../services/registry";

/**
 * Generic hook to access any registered service by name.
 * Useful for ad-hoc access without going through GatewayContext.
 */
export function useService<T>(name: string): T {
  return getService<T>(name);
}
