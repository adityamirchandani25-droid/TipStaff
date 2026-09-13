// Server-side geocoding for service addresses. A missing token or an
// unmatched address is a hard failure: dispatch must never use fabricated
// coordinates in production.

export interface GeocodedPoint {
  lat: number;
  lng: number;
}

export async function geocodeAddress(address: {
  line1: string;
  city: string;
  state: string;
  postalCode: string;
}): Promise<GeocodedPoint> {
  // Prefer a server-only token. The public-token fallback keeps existing
  // deployments working while they migrate their environment configuration.
  const token = process.env.MAPBOX_TOKEN ?? process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token) throw new Error("MAPBOX_TOKEN is not configured");

  const params = new URLSearchParams({
    q: `${address.line1}, ${address.city}, ${address.state} ${address.postalCode}`,
    country: "US",
    types: "address",
    autocomplete: "false",
    permanent: "true",
    limit: "1",
    access_token: token,
  });
  const res = await fetch(`https://api.mapbox.com/search/geocode/v6/forward?${params}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`Mapbox geocoding failed: ${res.status}`);
  const data = await res.json();
  const center = data.features?.[0]?.geometry?.coordinates;
  if (!Array.isArray(center) || center.length < 2) throw new Error("Address could not be geocoded");
  const [lng, lat] = center;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) throw new Error("Geocoder returned invalid coordinates");
  return { lat, lng };
}
