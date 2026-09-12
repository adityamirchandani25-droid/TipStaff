"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, MapPinOff } from "lucide-react";

// Polling on an interval rather than navigator.geolocation.watchPosition —
// watchPosition fires on every small GPS jitter, which would hammer the
// location endpoint. A ping every 10s is plenty for a 50-mile-radius map.
const PING_INTERVAL_MS = 10_000;

export function LocationShareToggle({ initialOnline }: { initialOnline: boolean }) {
  const [sharing, setSharing] = useState(initialOnline);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    function ping() {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const res = await fetch("/api/providers/location", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                lat: position.coords.latitude,
                lng: position.coords.longitude,
              }),
            });
            if (!res.ok) throw new Error("location update failed");
            setError(null);
          } catch {
            setError("Couldn’t reach the server — retrying in the background.");
          }
        },
        () => {
          setError("Location permission is off. Turn it on to share your location.");
          setSharing(false);
        },
        { enableHighAccuracy: true, maximumAge: 15_000, timeout: 10_000 },
      );
    }

    if (!sharing) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      return;
    }

    // Unsupported browsers are turned away in handleToggle before `sharing`
    // ever becomes true; this is just a safety net so ping() below never
    // throws on a missing API.
    if (!("geolocation" in navigator)) return;

    ping();
    intervalRef.current = setInterval(ping, PING_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [sharing]);

  async function handleToggle() {
    if (sharing) {
      setSharing(false);
      fetch("/api/providers/location", { method: "DELETE" }).catch(() => {});
      return;
    }
    if (!("geolocation" in navigator)) {
      setError("This browser doesn’t support location sharing.");
      return;
    }
    setError(null);
    setSharing(true);
  }

  return (
    <div className="ts-location-toggle">
      <button type="button" onClick={handleToggle} className={sharing ? "is-sharing" : ""}>
        {sharing ? <MapPin size={16} /> : <MapPinOff size={16} />}
        {sharing ? "Sharing your location" : "Share my location"}
      </button>
      <p>{error ?? (sharing ? "Customers within 50 miles can see you on the map." : "Turn this on so nearby customers can see you.")}</p>
    </div>
  );
}
