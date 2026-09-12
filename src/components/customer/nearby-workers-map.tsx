"use client";

import { useEffect, useRef, useState } from "react";
import type * as Leaflet from "leaflet";
import { CATEGORY_LABELS } from "@/lib/categories";
import type { NearbyWorker } from "@/lib/geo";

const POLL_INTERVAL_MS = 15_000;
const RADIUS_MI = 50;

/**
 * Resolves the center point to search from, then renders the map. Live
 * browser location is the primary source — real GPS, same as the worker
 * side — with the customer's saved address as a fallback only if location
 * permission is denied or unavailable. This deliberately avoids depending
 * on address geocoding: without NEXT_PUBLIC_MAPBOX_TOKEN configured (see
 * lib/geocode.ts), saved addresses resolve to synthetic demo coordinates,
 * not the customer's real location.
 */
export function NearbyWorkersMap({ fallback }: { fallback: { lat: number; lng: number } | null }) {
  const [center, setCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [source, setSource] = useState<"locating" | "live" | "fallback" | "unavailable">("locating");

  useEffect(() => {
    let cancelled = false;
    if (!("geolocation" in navigator)) {
      // Resolve asynchronously (same as the callbacks below) rather than
      // setting state synchronously in the effect body.
      const timer = setTimeout(() => {
        if (cancelled) return;
        setCenter(fallback);
        setSource(fallback ? "fallback" : "unavailable");
      }, 0);
      return () => {
        cancelled = true;
        clearTimeout(timer);
      };
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (cancelled) return;
        setCenter({ lat: position.coords.latitude, lng: position.coords.longitude });
        setSource("live");
      },
      () => {
        if (cancelled) return;
        setCenter(fallback);
        setSource(fallback ? "fallback" : "unavailable");
      },
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 8_000 },
    );
    return () => {
      cancelled = true;
    };
  }, [fallback]);

  if (source === "locating") {
    return (
      <div className="flex h-80 w-full items-center justify-center rounded-[var(--radius-lg)] border border-border bg-surface-raised text-sm text-ink-500">
        Finding your location…
      </div>
    );
  }

  if (!center) {
    return (
      <div className="flex h-80 w-full flex-col items-center justify-center gap-1 rounded-[var(--radius-lg)] border border-border bg-surface-raised px-6 text-center text-sm text-ink-500">
        <p>Turn on location, or add a service address, to see workers near you.</p>
      </div>
    );
  }

  return (
    <div>
      {source === "fallback" && (
        <p className="mb-2 text-xs text-ink-500">Showing workers near your saved address. Turn on location for a more precise view.</p>
      )}
      <NearbyWorkersMapView lat={center.lat} lng={center.lng} />
    </div>
  );
}

/** Polls /api/providers/nearby and renders markers for workers currently
 * sharing their location within 50 miles of (lat, lng). */
function NearbyWorkersMapView({ lat, lng }: { lat: number; lng: number }) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<Leaflet.Map | null>(null);
  const layer = useRef<Leaflet.LayerGroup | null>(null);
  const [ready, setReady] = useState(false);
  const [workers, setWorkers] = useState<NearbyWorker[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let disposed = false;
    void import("leaflet").then((L) => {
      if (disposed || !container.current) return;
      const instance = L.map(container.current, { zoomControl: false, scrollWheelZoom: false }).setView([lat, lng], 9);
      map.current = instance;
      L.control.zoom({ position: "bottomright" }).addTo(instance);
      L.tileLayer(process.env.NEXT_PUBLIC_MAP_TILE_URL || "https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(instance);
      L.circleMarker([lat, lng], { radius: 6, color: "#2457d6", fillColor: "#2457d6", fillOpacity: 1, weight: 2 })
        .addTo(instance)
        .bindTooltip("You");
      layer.current = L.layerGroup().addTo(instance);
      setReady(true);
    });
    return () => {
      disposed = true;
      map.current?.remove();
      map.current = null;
    };
  }, [lat, lng]);

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const res = await fetch(`/api/providers/nearby?lat=${lat}&lng=${lng}&radius=${RADIUS_MI}`);
        if (!res.ok) throw new Error("nearby lookup failed");
        const data: { workers: NearbyWorker[] } = await res.json();
        if (!cancelled) {
          setWorkers(data.workers ?? []);
          setError(null);
        }
      } catch {
        if (!cancelled) setError("Couldn’t load nearby workers.");
      }
    }
    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [lat, lng]);

  useEffect(() => {
    if (!ready || !layer.current) return;
    let disposed = false;
    void import("leaflet").then((L) => {
      if (disposed || !layer.current) return;
      layer.current.clearLayers();
      workers.forEach((worker) => {
        L.circleMarker([worker.lat, worker.lng], {
          radius: 8,
          color: "#16a34a",
          fillColor: "#16a34a",
          fillOpacity: 0.85,
          weight: 2,
        })
          .addTo(layer.current!)
          .bindTooltip(
            `${worker.name} · ${worker.categories.map((c) => CATEGORY_LABELS[c]).join(", ")} · ${worker.distanceMi.toFixed(1)} mi away`,
          );
      });
    });
    return () => {
      disposed = true;
    };
  }, [workers, ready]);

  return (
    <div className="relative h-80 w-full overflow-hidden rounded-[var(--radius-lg)] border border-border">
      <div
        ref={container}
        className="h-full w-full"
        aria-label="Map of workers currently sharing their location within 50 miles"
      />
      {!ready && (
        <div className="absolute inset-0 grid place-items-center bg-surface-raised text-sm text-ink-500">
          Loading the map…
        </div>
      )}
      {error && (
        <p role="status" className="absolute right-3 top-3 rounded-md border border-border bg-surface-raised px-3 py-2 text-xs text-ink-600 shadow-sm">
          {error}
        </p>
      )}
      {ready && !error && workers.length === 0 && (
        <p className="absolute left-3 top-3 rounded-md border border-border bg-surface-raised px-3 py-2 text-xs text-ink-600 shadow-sm">
          No workers are sharing their location nearby right now.
        </p>
      )}
    </div>
  );
}
