"use client";

import { useEffect, useRef, useState } from "react";
import { LocateFixed } from "lucide-react";
import type * as Leaflet from "leaflet";
import type { DirectoryListing } from "@/lib/directory";

export default function CompanyMap({ center, listings, selectedId, onSelect, locationState, onLocate }: { center: { lat: number; lng: number } | null; listings: DirectoryListing[]; selectedId: string | null; onSelect: (id: string) => void; locationState: string; onLocate: () => void }) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<Leaflet.Map | null>(null);
  const layer = useRef<Leaflet.LayerGroup | null>(null);
  const select = useRef(onSelect);
  const [ready, setReady] = useState(false);
  const [tileError, setTileError] = useState(false);
  useEffect(() => { select.current = onSelect; }, [onSelect]);

  useEffect(() => {
    if (!center) return;
    let disposed = false;
    let resize: ResizeObserver | undefined;
    void import("leaflet").then(L => {
      if (disposed || !container.current) return;
      const instance = L.map(container.current, { zoomControl: false, scrollWheelZoom: true }).setView([center.lat, center.lng], 10);
      map.current = instance;
      L.control.zoom({ position: "bottomright" }).addTo(instance);
      L.tileLayer(process.env.NEXT_PUBLIC_MAP_TILE_URL || "https://tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors', maxZoom: 19 }).on("tileerror", () => setTileError(true)).addTo(instance);
      L.circleMarker([center.lat, center.lng], { radius: 6, color: "#2457d6", fillColor: "#2457d6", fillOpacity: 1, weight: 2 }).addTo(instance).bindTooltip("Your approximate location");
      layer.current = L.layerGroup().addTo(instance);
      resize = new ResizeObserver(() => instance.invalidateSize());
      resize.observe(container.current);
      setReady(true);
    }).catch(() => setTileError(true));
    return () => { disposed = true; resize?.disconnect(); map.current?.remove(); map.current = null; layer.current = null; setReady(false); };
  }, [center]);

  useEffect(() => {
    if (!center || !ready || !layer.current || !map.current) return;
    let disposed = false;
    void import("leaflet").then(L => {
      if (disposed || !layer.current || !map.current) return;
      const markers = layer.current;
      markers.clearLayers();
      listings.forEach((listing, index) => {
        const element = document.createElement("div");
        element.className = `company-map-pin${selectedId === listing.id ? " selected" : ""}`;
        element.innerHTML = '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M3 6h11v12H3zM14 10h4l3 4v4h-7"/><circle cx="7" cy="18" r="2" fill="white"/><circle cx="18" cy="18" r="2" fill="white"/></svg>';
        const number = document.createElement("span"); number.textContent = String(index + 1); element.appendChild(number);
        const marker = L.marker([listing.lat, listing.lng], { icon: L.divIcon({ html: element, className: "driver-map-marker", iconSize: [54, 42], iconAnchor: [27, 42] }), title: `${listing.name} — online provider`, alt: listing.name, keyboard: true, zIndexOffset: selectedId === listing.id ? 1000 : 0 }).addTo(markers);
        marker.on("click", () => select.current(listing.id));
        marker.bindTooltip(listing.companyName ? `${listing.name} · ${listing.companyName}` : listing.name, { direction: "top", offset: [0, -42] });
      });
      const chosen = listings.find(listing => listing.id === selectedId);
      if (chosen) map.current.panTo([chosen.lat, chosen.lng], { animate: !window.matchMedia("(prefers-reduced-motion: reduce)").matches });
      else if (listings.length) map.current.fitBounds(L.latLngBounds([[center.lat, center.lng], ...listings.map(item => [item.lat, item.lng] as [number, number])]), { padding: [70, 70], maxZoom: 12, animate: false });
    });
    return () => { disposed = true; };
  }, [center, listings, selectedId, ready]);

  if (!center) return <div className="company-map-shell directory-map-gate"><div><span><LocateFixed size={30} /></span><h2>See who is available around you</h2><p>The map only displays approved providers who are online and sharing a recent location.</p><button type="button" className="directory-primary" onClick={onLocate} disabled={locationState === "locating"}>{locationState === "locating" ? "Finding your location…" : "Use my location"}</button></div></div>;
  return <div className="company-map-shell"><div ref={container} className="company-map-canvas" aria-label="Map of approved providers currently online near you" />{!ready && <div className="map-loading">Loading the map…</div>}{tileError && <p className="map-network-note" role="status">Map tiles couldn’t load. You can still browse available providers in the list.</p>}<div className="map-location"><span /> Your area <small>Live providers within 50 miles</small></div><div className="map-legend"><span className="legend-van">↗</span> Select a marker to view the provider</div></div>;
}
