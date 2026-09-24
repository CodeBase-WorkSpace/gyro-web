"use client";

import {useEffect} from "react";

import {trackEvent, type AnalyticsEventData} from "@/lib/analytics";

/**
 * Fires an analytics event once per browser session, deduped so refreshes
 * and back-navigation don't inflate counts.
 */
export function TrackOnce({event, data}: {event: string; data?: AnalyticsEventData}) {
  useEffect(() => {
    const key = `gyro-tracked:${event}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // Private mode without storage: still track, accepting possible dupes.
    }
    trackEvent(event, data);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fire once per mount/event name
  }, [event]);

  return null;
}
