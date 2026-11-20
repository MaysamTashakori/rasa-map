export function getLocationSearchCacheKey(
  lookup: string,
  limit: number,
  language = "en",
): string {
  return `location-search:${language}:${lookup.toLowerCase()}:limit:${limit}`;
}

export function getGeocodeCacheKey(lookup: string, language = "en"): string {
  return `geocode:location:${language}:${lookup.toLowerCase()}`;
}

export function getReverseGeocodeCacheKey(
  lat: number,
  lon: number,
  language = "en",
): string {
  const roundedLat = lat.toFixed(4);
  const roundedLon = lon.toFixed(4);
  return `geocode:reverse:${language}:${roundedLat},${roundedLon}`;
}
