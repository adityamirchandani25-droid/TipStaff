"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, Check, ChevronRight, Info, List, LocateFixed, Map, MapPin, Search, Star, UserRoundCheck, X } from "lucide-react";
import { CATEGORY_ORDER, CATEGORY_LABELS, type ServiceCategory } from "@/lib/categories";
import { filterDirectoryListings, type DirectoryListing } from "@/lib/directory";
import type { ServiceEstimates } from "@/lib/pricing";
import { CategoryIcon } from "@/components/category-icon";

const CompanyMap = dynamic(() => import("./company-map"), { ssr: false, loading: () => <div className="map-loading">Loading the map…</div> });
const SEARCH_RADIUS_MI = 50;
const REFRESH_INTERVAL_MS = 15_000;

type LocationState = "idle" | "locating" | "ready" | "denied" | "error";

export function CompanyDirectory({ initialCategory, estimates, canRequest }: { initialCategory: ServiceCategory | "ALL"; estimates: ServiceEstimates; canRequest: boolean }) {
  const [category, setCategory] = useState<ServiceCategory | "ALL">(initialCategory);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [view, setView] = useState<"list" | "map">("list");
  const [center, setCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [locationState, setLocationState] = useState<LocationState>("idle");
  const [listings, setListings] = useState<DirectoryListing[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadListings = useCallback(async (point: { lat: number; lng: number }, service: ServiceCategory | "ALL") => {
    const params = new URLSearchParams({ lat: String(point.lat), lng: String(point.lng), radius: String(SEARCH_RADIUS_MI) });
    if (service !== "ALL") params.set("category", service);
    try {
      const response = await fetch(`/api/providers/nearby?${params}`, { cache: "no-store" });
      if (!response.ok) throw new Error("nearby provider request failed");
      const data = await response.json() as { workers?: DirectoryListing[] };
      setListings(data.workers ?? []);
      setLoadError(null);
    } catch {
      setLoadError("We couldn’t refresh nearby availability. Try again in a moment.");
    }
  }, []);

  useEffect(() => {
    if (!center) return;
    const initialLoad = window.setTimeout(() => void loadListings(center, category), 0);
    const interval = window.setInterval(() => void loadListings(center, category), REFRESH_INTERVAL_MS);
    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(interval);
    };
  }, [category, center, loadListings]);

  function requestLocation() {
    if (!("geolocation" in navigator)) {
      setLocationState("error");
      return;
    }
    setLocationState("locating");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCenter({ lat: position.coords.latitude, lng: position.coords.longitude });
        setLocationState("ready");
      },
      (error) => setLocationState(error.code === error.PERMISSION_DENIED ? "denied" : "error"),
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 10_000 },
    );
  }

  const filtered = useMemo(() => filterDirectoryListings(listings, category, query), [category, listings, query]);
  const listing = filtered.find((item) => item.id === selected) ?? null;
  function chooseListing(id: string) { setSelected(id); setView("list"); }
  function chooseCategory(value: ServiceCategory | "ALL") { setCategory(value); setSelected(null); }
  const locationLabel = locationState === "ready" ? `Live providers within ${SEARCH_RADIUS_MI} miles` : "Location needed";

  return <div className="directory-app">
    <nav className="service-category-bar" aria-label="Filter by service"><button type="button" aria-pressed={category === "ALL"} onClick={() => chooseCategory("ALL")}><List size={19} /><span>All services</span></button>{CATEGORY_ORDER.map(item => <button type="button" key={item} aria-pressed={category === item} onClick={() => chooseCategory(item)}><CategoryIcon category={item} className="h-[19px] w-[19px]" /><span>{CATEGORY_LABELS[item]}</span></button>)}</nav>
    <div className="directory-toolbar"><div><MapPin size={17} /><strong>{locationLabel}</strong>{locationState === "ready" && <span className="directory-live"><i />Live availability</span>}</div><label className="company-search"><Search size={16} /><input aria-label="Search providers" placeholder="Search provider or company" value={query} onChange={event => { setQuery(event.target.value); setSelected(null); }} />{query && <button type="button" aria-label="Clear search" onClick={() => setQuery("")}><X size={14} /></button>}</label><div className="directory-mobile-toggle"><button onClick={() => setView("list")} aria-pressed={view === "list"}><List size={16} /> List</button><button onClick={() => setView("map")} aria-pressed={view === "map"}><Map size={16} /> Map</button></div></div>
    <div className={`directory-workspace view-${view}`}>
      <aside className="company-list-panel" aria-label="Available providers">
        {listing ? <ProviderDetail listing={listing} category={category} estimates={estimates} canRequest={canRequest} onBack={() => setSelected(null)} /> : <>
          <div className="companies-heading"><h1>{category === "ALL" ? "Available providers near you" : `${CATEGORY_LABELS[category]} providers near you`}</h1><p>{locationState === "ready" ? `${filtered.length} currently sharing availability · Updated automatically` : "Use your location to see approved providers who are online nearby."}</p></div>
          {loadError && <p className="directory-load-error" role="status">{loadError}</p>}
          {locationState !== "ready" ? <LocationPrompt state={locationState} onLocate={requestLocation} category={category} canRequest={canRequest} /> : <div className="company-results">{filtered.map((item, index) => <button type="button" key={item.id} className="company-result" onClick={() => chooseListing(item.id)}><div className="company-card-heading"><ProviderMonogram listing={item} /><span className="company-map-number">{index + 1}</span></div><h2>{item.name}</h2><p><MapPin size={13} />{item.distanceMi.toFixed(1)} miles away · Online now</p>{item.companyName && <p className="provider-company">{item.companyName}</p>}<div className="company-card-categories">{item.categories.map(c => CATEGORY_LABELS[c]).join(" · ")}</div><div className="company-card-bottom"><ProviderRating listing={item} /><ChevronRight size={18} /></div></button>)}{!filtered.length && <div className="company-no-results"><Search size={28} /><h2>{query ? "No matching providers" : "No providers online nearby"}</h2><p>{query ? "Try another name or clear your search." : "Availability changes throughout the day. You can still create a request and we’ll begin matching it."}</p>{query ? <button onClick={() => setQuery("")}>Clear search</button> : <RequestLink category={category} canRequest={canRequest} className="directory-empty-action">Create a service request <ArrowRight size={15} /></RequestLink>}</div>}</div>}
          <p className="directory-list-note"><Info size={15} />Only approved providers actively sharing a recent location appear here. Location and availability refresh automatically.</p>
        </>}
      </aside>
      <section className="directory-map-panel" aria-label="Live provider map"><CompanyMap center={center} listings={filtered} selectedId={selected} onSelect={chooseListing} locationState={locationState} onLocate={requestLocation} /></section>
    </div>
  </div>;
}

function LocationPrompt({ state, onLocate, category, canRequest }: { state: LocationState; onLocate: () => void; category: ServiceCategory | "ALL"; canRequest: boolean }) {
  const unavailable = state === "denied" || state === "error";
  return <div className="directory-location-prompt"><span><LocateFixed size={25} /></span><h2>{unavailable ? "Location is unavailable" : "Find real availability around you"}</h2><p>{state === "denied" ? "Location access was blocked. Allow it in your browser settings, then try again." : state === "error" ? "We couldn’t determine your location. Check your browser settings or create a request without the map." : "Your location is used to find approved providers sharing availability within 50 miles. It is not saved from this page."}</p><button type="button" className="directory-primary" onClick={onLocate} disabled={state === "locating"}>{state === "locating" ? "Finding your location…" : "Use my location"} <LocateFixed size={17} /></button><RequestLink category={category} canRequest={canRequest} className="directory-general-request">Continue without the map <ArrowRight size={15} /></RequestLink></div>;
}

function ProviderDetail({ listing, category, estimates, canRequest, onBack }: { listing: DirectoryListing; category: ServiceCategory | "ALL"; estimates: ServiceEstimates; canRequest: boolean; onBack: () => void }) {
  const service = category === "ALL" ? listing.categories[0] : category;
  const estimate = estimates[service].THIS_WEEK;
  return <div className="company-detail" key={listing.id}><button type="button" className="back-to-companies" onClick={onBack}><ArrowLeft size={15} /> All providers</button><div className="company-detail-heading"><ProviderMonogram listing={listing} /><span className="directory-live"><i />Online now</span></div><h1>{listing.name}</h1><p className="company-neighborhood"><MapPin size={14} />{listing.distanceMi.toFixed(1)} miles away{listing.companyName ? ` · ${listing.companyName}` : " · Independent professional"}</p><div className="company-detail-tags">{listing.categories.map(item => <span key={item}>{CATEGORY_LABELS[item]}</span>)}</div><p className="company-description">{listing.bio || `Approved to help with ${listing.categories.map(item => CATEGORY_LABELS[item].toLowerCase()).join(", ")}.`}</p><h2>Provider activity</h2><ul className="company-specialties"><li><UserRoundCheck size={15} />Approved FixItFast provider</li><li><Check size={15} />{listing.jobsCompleted} completed {listing.jobsCompleted === 1 ? "job" : "jobs"}</li>{listing.ratingCount > 0 && <li><Star size={15} />{listing.rating.toFixed(1)} from {listing.ratingCount} {listing.ratingCount === 1 ? "rating" : "ratings"}</li>}</ul><div className="company-price"><span>Typical callout + first hour estimate</span><strong>${estimate.low}–${estimate.high}</strong><p>Parts and extra time are additional. Final pricing is confirmed for the actual work.</p></div><RequestLink category={service} canRequest={canRequest} className="directory-primary">Request {CATEGORY_LABELS[service].toLowerCase()} service <ArrowRight size={18} /></RequestLink><p className="company-service-note">Nearby status can change. Your request enters the live matching flow and is not a guaranteed direct booking with this provider.</p></div>;
}

function RequestLink({ category, canRequest, className, children }: { category: ServiceCategory | "ALL"; canRequest: boolean; className: string; children: ReactNode }) {
  const service = category === "ALL" ? "" : `?category=${category}`;
  const requestPath = `/request/new${service}`;
  const href = canRequest ? requestPath : `/login?callbackUrl=${encodeURIComponent(requestPath)}`;
  return <Link href={href} className={className}>{children}</Link>;
}

function ProviderMonogram({ listing }: { listing: DirectoryListing }) {
  const initials = listing.name.split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase();
  return <span className="company-monogram provider-monogram">{initials}</span>;
}

function ProviderRating({ listing }: { listing: DirectoryListing }) {
  if (!listing.ratingCount) return <span className="provider-new">New provider</span>;
  return <span className="provider-rating"><Star size={13} fill="currentColor" />{listing.rating.toFixed(1)} <small>({listing.ratingCount})</small></span>;
}
