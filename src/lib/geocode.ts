import { findLocalCity, searchLocalCities, type CityLocation } from '../data/cities';

export interface GeocodedPlace {
  name: string;
  displayName: string;
  lat: number;
  lng: number;
  source: 'local' | 'online';
}

/** Look up coordinates: local database first, then free OpenStreetMap API */
export async function geocodePlace(query: string): Promise<GeocodedPlace | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;

  const local = findLocalCity(trimmed);
  if (local) {
    return {
      name: local.name,
      displayName: local.state ? `${local.name}, ${local.state}` : local.name,
      lat: local.lat,
      lng: local.lng,
      source: 'local',
    };
  }

  const suggestions = searchLocalCities(trimmed, 1);
  if (suggestions.length === 1 && suggestions[0].name.toLowerCase().includes(trimmed.toLowerCase())) {
    const city = suggestions[0];
    return {
      name: city.name,
      displayName: city.state ? `${city.name}, ${city.state}` : city.name,
      lat: city.lat,
      lng: city.lng,
      source: 'local',
    };
  }

  try {
    const url =
      `https://nominatim.openstreetmap.org/search?` +
      `q=${encodeURIComponent(trimmed + ', India')}&format=json&limit=1&countrycodes=in`;
    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'Accept-Language': 'en',
      },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { lat: string; lon: string; display_name: string }[];
    if (!data?.length) return null;
    const hit = data[0];
    const shortName = hit.display_name.split(',')[0].trim();
    return {
      name: shortName,
      displayName: hit.display_name,
      lat: parseFloat(hit.lat),
      lng: parseFloat(hit.lon),
      source: 'online',
    };
  } catch {
    return null;
  }
}

export { searchLocalCities, type CityLocation };
