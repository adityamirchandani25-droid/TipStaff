"use client";

import { useEffect, useRef, useState } from "react";
import type * as Leaflet from "leaflet";
import type { DirectoryCompany } from "@/lib/directory";

export default function CompanyMap({ companies, selectedId, onSelect }: { companies: DirectoryCompany[]; selectedId: string | null; onSelect: (id: string) => void }) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<Leaflet.Map | null>(null);
  const layer = useRef<Leaflet.LayerGroup | null>(null);
  const select = useRef(onSelect);
  const [ready, setReady] = useState(false);
  const [tileError, setTileError] = useState(false);
  useEffect(() => { select.current = onSelect; }, [onSelect]);
  useEffect(() => {
    let disposed = false;
    let resize: ResizeObserver | undefined;
    void import("leaflet").then(L => {
      if (disposed || !container.current) return;
      const instance = L.map(container.current, { zoomControl: false, scrollWheelZoom: true }).setView([30.272, -97.743], 12);
      map.current = instance;
      L.control.zoom({ position: "bottomright" }).addTo(instance);
      L.tileLayer(process.env.NEXT_PUBLIC_MAP_TILE_URL || "https://tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors', maxZoom: 19 }).on("tileerror", () => setTileError(true)).addTo(instance);
      layer.current = L.layerGroup().addTo(instance);
      resize = new ResizeObserver(() => instance.invalidateSize());
      resize.observe(container.current);
      setReady(true);
    }).catch(() => setTileError(true));
    return () => { disposed = true; resize?.disconnect(); map.current?.remove(); map.current = null; };
  }, []);
  useEffect(() => {
    if (!ready || !layer.current || !map.current) return;
    let disposed = false;
    void import("leaflet").then(L => {
      if (disposed || !layer.current || !map.current) return;
      const markers = layer.current;
      markers.clearLayers();
      companies.forEach((company, index) => {
        const element = document.createElement("div");
        element.className = `company-map-pin${selectedId === company.id ? " selected" : ""}`;
        element.style.setProperty("--pin-color", company.color);
        element.innerHTML = '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M3 6h11v12H3zM14 10h4l3 4v4h-7"/><circle cx="7" cy="18" r="2" fill="white"/><circle cx="18" cy="18" r="2" fill="white"/></svg>';
        const number = document.createElement("span"); number.textContent = String(index + 1); element.appendChild(number);
        const marker = L.marker([company.lat, company.lng], { icon: L.divIcon({ html: element, className: "driver-map-marker", iconSize: [54, 42], iconAnchor: [27, 42] }), title: `${company.name} — demo worker ${company.worker}`, alt: company.name, keyboard: true, zIndexOffset: selectedId === company.id ? 1000 : 0 }).addTo(markers);
        marker.on("click", () => select.current(company.id));
        const label = document.createElement("span"); label.textContent = company.name;
        marker.bindTooltip(label, { direction: "top", offset: [0, -42] });
      });
      const chosen = companies.find(company => company.id === selectedId);
      if (chosen) map.current.panTo([chosen.lat, chosen.lng], { animate: !window.matchMedia("(prefers-reduced-motion: reduce)").matches });
      else if (companies.length) map.current.fitBounds(L.latLngBounds(companies.map(c => [c.lat, c.lng])), { padding: [70, 70], maxZoom: 13, animate: false });
    });
    return () => { disposed = true; };
  }, [companies, selectedId, ready]);
  return <div className="company-map-shell"><div ref={container} className="company-map-canvas" aria-label="Interactive map of demo worker locations in Austin" />{!ready && <div className="map-loading">Loading the map…</div>}{tileError && <p className="map-network-note" role="status">Map tiles couldn’t load. You can still browse every company in the list.</p>}<div className="map-location"><span /> Austin, TX <small>Demo worker locations</small></div><div className="map-legend"><span className="legend-van">↗</span> Select a marker to view the company</div></div>;
}
