import { Station, StationCollection } from '@/types/Station';

import { distanceBetweenCoordsInKm, LatLon } from './geography';
import { isNotNil } from './misc';

export function getStationsSortedByName(stations: StationCollection): Station[] {
  return Object.values(stations)
    .filter(isNotNil)
    .sort((a, b) => a.name.localeCompare(b.name, 'fi-FI'));
}

export function getNearestStations(
  stations: StationCollection,
  origin: LatLon,
  count: number
): Station[] {
  return Object.values(stations)
    .filter(isNotNil)
    .map((station) => ({
      station,
      distance: distanceBetweenCoordsInKm(origin, station.location),
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, count)
    .map((a) => a.station);
}
