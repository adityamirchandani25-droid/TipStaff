// Geocoding for new addresses. With a Mapbox token configured, this calls
// the real Geocoding API; otherwise it falls back to a deterministic
// mock — jittered around Austin, TX, seeded from the postal code so the
// same address always lands at the same point (useful for distance-based
// matching in dev without a real key).

const MOCK_ORIGIN = { lat: 30.2711, lng: -97.7437 };

function seededJitter(seed: string, range: number) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return ((hash % 1000) / 1000) * range - range / 2;
}

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
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token) {
    const seed = `${address.line1}${address.postalCode}`;
    return {
      lat: MOCK_ORIGIN.lat + seededJitter(seed, 0.08),
      lng: MOCK_ORIGIN.lng + seededJitter(seed + "lng", 0.08),
    };
  }

  const query = encodeURIComponent(
    `${address.line1}, ${address.city}, ${address.state} ${address.postalCode}`,
  );
  const res = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?limit=1&access_token=${token}`,
  );
  if (!res.ok) throw new Error(`Mapbox geocoding failed: ${res.status}`);
  const data = await res.json();
  const [lng, lat] = data.features?.[0]?.center ?? [MOCK_ORIGIN.lng, MOCK_ORIGIN.lat];
  return { lat, lng };
}
