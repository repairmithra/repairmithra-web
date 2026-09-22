// Small input-validation helpers.

// True only for a 24-character hex string. Also rejects arrays/objects, so a
// request like { "bookingId": { "$ne": null } } can never reach a Mongo query.
export const isObjectId = (value) =>
  typeof value === "string" && /^[a-f\d]{24}$/i.test(value);

// Parses a latitude/longitude that may arrive as a number or numeric string.
// Returns NaN for null, "", objects, etc. (Number(null) would wrongly be 0).
export const toCoordinate = (value) => {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() !== "") {
    return Number(value);
  }
  return Number.NaN;
};

export const isValidLatLng = (lat, lng) =>
  Number.isFinite(lat) &&
  Number.isFinite(lng) &&
  lat >= -90 &&
  lat <= 90 &&
  lng >= -180 &&
  lng <= 180;