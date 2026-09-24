"use client";

import {createContext, type ReactNode, useContext, useEffect, useMemo, useRef, useState} from "react";

type ServiceWorkerUpdateContextValue = {
  isUpdateAvailable: boolean;
  isUpdating: boolean;
  applyUpdate: () => void;
};

const DEV_SERVICE_WORKER_CLEANUP_KEY = "gyro-dev-service-worker-cleanup";
const GYRO_CACHE_PREFIXES = ["gyro-startup-recovery-", "gyro-runtime-"];

const ServiceWorkerUpdateContext = createContext<ServiceWorkerUpdateContextValue | null>(null);

export function ServiceWorkerRegistration({children}: {children: ReactNode}) {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const shouldReloadAfterActivation = useRef(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") {
      void removeDevelopmentServiceWorkers().catch(() => {
        // Development cleanup is best-effort and must never block rendering.
      });
      return;
    }

    const reloadAfterActivation = () => {
      if (shouldReloadAfterActivation.current) window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", reloadAfterActivation);

    navigator.serviceWorker.register("/sw.js", {updateViaCache: "none"})
      .then((registration) => {
        window.sessionStorage.removeItem("gyro-pwa-startup-recovery-attempt");
        const setUpdateAvailable = () => {
          if (registration.waiting) setWaitingWorker(registration.waiting);
        };

        setUpdateAvailable();
        registration.addEventListener("updatefound", () => {
          const installingWorker = registration.installing;
          if (!installingWorker) return;
          installingWorker.addEventListener("statechange", () => {
            if (installingWorker.state === "installed" && navigator.serviceWorker.controller) {
              setUpdateAvailable();
            }
          });
        });
        return registration.update();
      })
      .catch(() => {
      // Installation support is progressive; failed registration should not block the app.
      });

    return () => navigator.serviceWorker.removeEventListener("controllerchange", reloadAfterActivation);
  }, []);

  const value = useMemo<ServiceWorkerUpdateContextValue>(() => ({
    isUpdateAvailable: waitingWorker !== null,
    isUpdating,
    applyUpdate: () => {
      if (!waitingWorker || isUpdating) return;
      setIsUpdating(true);
      shouldReloadAfterActivation.current = true;
      // A waiting worker has already downloaded successfully. Activation is safe and the
      // controllerchange listener reloads exactly once so the user receives matching assets.
      waitingWorker.postMessage({type: "SKIP_WAITING"});
    },
  }), [isUpdating, waitingWorker]);

  return <ServiceWorkerUpdateContext.Provider value={value}>{children}</ServiceWorkerUpdateContext.Provider>;
}

async function removeDevelopmentServiceWorkers() {
  const hadController = navigator.serviceWorker.controller !== null;
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map((registration) => registration.unregister()));

  if ("caches" in window) {
    const cacheNames = await window.caches.keys();
    await Promise.all(
      cacheNames
        .filter((cacheName) =>
          GYRO_CACHE_PREFIXES.some((prefix) => cacheName.startsWith(prefix)),
        )
        .map((cacheName) => window.caches.delete(cacheName)),
    );
  }

  if (
    hadController &&
    window.sessionStorage.getItem(DEV_SERVICE_WORKER_CLEANUP_KEY) !== "done"
  ) {
    window.sessionStorage.setItem(DEV_SERVICE_WORKER_CLEANUP_KEY, "done");
    window.location.reload();
    return;
  }

  window.sessionStorage.removeItem(DEV_SERVICE_WORKER_CLEANUP_KEY);
}

export function useServiceWorkerUpdate() {
  const context = useContext(ServiceWorkerUpdateContext);
  if (!context) throw new Error("useServiceWorkerUpdate must be used within ServiceWorkerRegistration.");
  return context;
}
