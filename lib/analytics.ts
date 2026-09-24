export type AnalyticsEventData = Record<string, string | number | boolean>;

declare global {
  interface Window {
    umami?: {track: (event: string, data?: AnalyticsEventData) => void};
  }
}

const queued: Array<{event: string; data?: AnalyticsEventData}> = [];
let flushTimer: ReturnType<typeof setInterval> | undefined;
let flushAttempts = 0;

function flushQueue() {
  if (!window.umami) {
    // Stop retrying after ~30s: the script is blocked or unconfigured.
    if (++flushAttempts > 60 && flushTimer !== undefined) {
      clearInterval(flushTimer);
      flushTimer = undefined;
      queued.length = 0;
    }
    return;
  }
  while (queued.length > 0) {
    const next = queued.shift();
    if (next) window.umami.track(next.event, next.data);
  }
  if (flushTimer !== undefined) {
    clearInterval(flushTimer);
    flushTimer = undefined;
  }
}

/**
 * Event names follow the SEO roadmap taxonomy (docs/product/seo-growth-roadmap.md).
 * Never include personal data (identifiers, body metrics, diary contents).
 *
 * Events fired before the Umami script finishes loading are queued and
 * flushed once it appears, so early interactions are not lost.
 */
export function trackEvent(event: string, data?: AnalyticsEventData) {
  try {
    if (window.umami) {
      window.umami.track(event, data);
      return;
    }
    queued.push({event, data});
    if (flushTimer === undefined) {
      flushAttempts = 0;
      flushTimer = setInterval(flushQueue, 500);
    }
  } catch {
    // Analytics must never break the page.
  }
}

/** Copies utm_* parameters onto an absolute or same-origin URL. */
export function withUtmParams(url: string): string {
  try {
    const target = new URL(url, window.location.origin);
    const current = new URLSearchParams(window.location.search);
    for (const [key, value] of current) {
      if (key.startsWith("utm_")) target.searchParams.set(key, value);
    }
    return target.toString();
  } catch {
    return url;
  }
}
