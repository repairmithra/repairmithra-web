// ---------------------------------------------------------------------------
// Turning an address into map coordinates (and back).
//
// The backend needs a latitude/longitude for every booking so it can find
// technicians within 20 km. We use OpenStreetMap's free Nominatim service.
//
//  • Its usage policy allows about 1 request per second — fine for a booking
//    form, but if traffic grows, switch to a paid geocoder (Google Maps,
//    Mapbox, Ola Maps…) by changing only this file.
// ---------------------------------------------------------------------------

const NOMINATIM = "https://nominatim.openstreetmap.org";
const REQUEST_TIMEOUT_MS = 10000;
const PAUSE_BETWEEN_TRIES_MS = 1100;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const nominatim = async (path, params) => {
  const query = new URLSearchParams({ format: "jsonv2", ...params });

  const response = await fetch(`${NOMINATIM}/${path}?${query}`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) throw new Error("lookup-failed");
  return response.json();
};

// ---- Browser GPS -----------------------------------------------------------

export const getCurrentPosition = () =>
  new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("unsupported"));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15000,
    });
  });

// GPS → street address + the coordinates themselves
export async function lookupCurrentLocation() {
  const { coords } = await getCurrentPosition();

  const { address = {}, display_name: displayName = "" } = await nominatim(
    "reverse",
    {
      addressdetails: 1,
      lat: coords.latitude,
      lon: coords.longitude,
    }
  );

  const street = [
    address.house_number,
    address.road,
    address.neighbourhood || address.suburb,
  ]
    .filter(Boolean)
    .join(", ");

  const city =
    address.city ||
    address.town ||
    address.village ||
    address.county ||
    (address.state_district || "").replace(/ district$/i, "");

  const postcode = (address.postcode || "").replace(/\s/g, "");

  return {
    address: street || displayName,
    city,
    pincode: /^\d{6}$/.test(postcode) ? postcode : "",
    latitude: coords.latitude,
    longitude: coords.longitude,
  };
}

// ---- Typed address → coordinates ------------------------------------------

const firstPoint = (results) => {
  const hit = Array.isArray(results) ? results[0] : null;
  if (!hit) return null;

  const latitude = Number(hit.lat);
  const longitude = Number(hit.lon);

  return Number.isFinite(latitude) && Number.isFinite(longitude)
    ? { latitude, longitude }
    : null;
};

// Full house-level addresses often are not on the map in India, so we fall
// back to progressively coarser matches: the exact address → the pincode area
// → the city. Any of these is accurate enough to find technicians within 20 km.
//
// Throws Error("not-found") if nothing matches, Error("lookup-failed") if the
// geocoding service cannot be reached.
export async function geocodeAddress({ address, city, pincode }) {
  const attempts = [
    { q: [address, city, pincode, "India"].filter(Boolean).join(", ") },
    { postalcode: pincode },
    { q: [city, "India"].filter(Boolean).join(", ") },
  ];

  for (let index = 0; index < attempts.length; index += 1) {
    if (index > 0) await sleep(PAUSE_BETWEEN_TRIES_MS);

    const results = await nominatim("search", {
      limit: 1,
      countrycodes: "in",
      ...attempts[index],
    });

    const point = firstPoint(results);
    if (point) return point;
  }

  throw new Error("not-found");
}