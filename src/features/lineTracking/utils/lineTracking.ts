import { isNil, minBy } from 'lodash';
import { DateTime } from 'luxon';

import { getTrainsOfStation } from '@/api/digitrafficClient';
import { calculateCauses } from '@/features/lateCauses';
import { useTrainDataStore } from '@/stores/trainData';
import { Station, StationCollection } from '@/types/Station';
import { Train } from '@/types/Train';
import { TrainEvent, TrainEventType } from '@/types/TrainEvent';
import { LatLon, nearestPointSegment } from '@/utils/geography';
import { getCurrentLocation } from '@/utils/geolocation';
import { isNotNil } from '@/utils/misc';
import { getNearestStations } from '@/utils/stations';
import { calculateLateMins, timetableExpiresAt } from '@/utils/timetableCalculation';

import { LocationOnLine, LocationOnLineResult } from '../types/LocationOnLine';

const MAX_EVENTS_IN_FUTURE = 5;

export function calculateCurrentEvents(
  trains: Train[],
  stationCode1: string | null,
  stationCode2: string | null,
  location: number
): TrainEvent[] {
  if (isNil(stationCode1) || isNil(stationCode2)) {
    return [];
  }
  const trainEvents = trains
    .flatMap((train) =>
      train.timetableRows
        .slice(0, -1) // Exclude the last element as it's used in pair with the previous one
        .flatMap((row, index) => {
          const nextRow = train.timetableRows[index + 1];
          let time: DateTime | null = null;

          if (row.stationShortCode === stationCode1 && nextRow.stationShortCode === stationCode2) {
            time = row.time.plus(nextRow.time.diff(row.time).mapUnits((x) => x * (location / 100)));
          } else if (
            row.stationShortCode === stationCode2 &&
            nextRow.stationShortCode === stationCode1
          ) {
            time = nextRow.time.minus(
              nextRow.time.diff(row.time).mapUnits((x) => x * (location / 100))
            );
          }

          return isNotNil(time) ? [createEvent(train, time, index + 1)] : [];
        })
    )
    .sort((a, b) => a.time.toMillis() - b.time.toMillis());

  const now = DateTime.now();
  const nextInFutureIndex = trainEvents.findIndex((event) => event.time > now);
  return trainEvents.slice(Math.max(nextInFutureIndex - MAX_EVENTS_IN_FUTURE, 0));
}

function getExpiration(train: Train, time: DateTime): DateTime | null {
  const expiresAt = timetableExpiresAt(train);
  return expiresAt !== null && expiresAt < time ? expiresAt : null;
}

function createEvent(train: Train, time: DateTime, index: number): TrainEvent {
  const stations = useTrainDataStore.getState().stations;
  const origin = stations[train.timetableRows[0].stationShortCode]?.name ?? '';
  const destination =
    stations[train.timetableRows[train.timetableRows.length - 1].stationShortCode]?.name ?? '';
  return {
    name: `${train.name} ${origin} - ${destination}`,
    lateCauses: calculateCauses(train.timetableRows, index),
    lateMinutes: calculateLateMins(train.timetableRows, index, train.latestActualTimeIndex),
    lineId: train.lineId,
    track: null,
    isReady: train.isReady,
    expiresAt: getExpiration(train, time),
    time,
    eventType: TrainEventType.Passing,
  };
}

export async function getAdjacentStationsFromTimetable(
  station: Station,
  stations: StationCollection
): Promise<Station[]> {
  const trains = await getTrainsOfStation(station.shortCode);
  const adjacents = trains.flatMap((train) =>
    train.timetableRows.flatMap((row, index, self) =>
      index > 0 && row.stationShortCode === station.shortCode
        ? [self[index - 1].stationShortCode]
        : index < self.length - 1 && row.stationShortCode === station.shortCode
        ? [self[index + 1].stationShortCode]
        : []
    )
  );

  const uniqueAdjacents = new Set(adjacents.filter((code) => code !== station.shortCode));

  return Array.from(uniqueAdjacents)
    .map((code) => stations[code])
    .filter(isNotNil)
    .sort((a, b) => a.name.localeCompare(b.name, 'fi-FI'));
}

export async function getLocationOnLine(): Promise<LocationOnLineResult> {
  try {
    const location = await getCurrentLocation();
    const stations = useTrainDataStore.getState().stations;
    const nearest = getNearestStations(stations, location, 2);
    const firstSearch = getNearest(location, nearest[0], stations);
    const secondSearch = getNearest(location, nearest[1], stations);
    const searchResult = await Promise.all([firstSearch, secondSearch]);
    const distances = searchResult.filter(isNotNil);
    const best = minBy(distances, (d) => d.distance) ?? {
      station1: nearest[0],
      station2: nearest[1],
      location: 0,
      distance: 0,
    };
    return best;
  } catch (error: any) {
    return {
      error,
    };
  }
}

async function getNearest(location: LatLon, station: Station, stations: StationCollection) {
  const adjacents = await getAdjacentStationsFromTimetable(station, stations);
  const nearest = getNearestLocationOnLine(location, station, adjacents);
  return nearest;
}

function getNearestLocationOnLine(
  location: LatLon,
  currentStation: Station,
  adjacentStations: Station[]
): LocationOnLine | null {
  const distances: LocationOnLine[] = adjacentStations
    .map((station) => {
      const nearestPoint = nearestPointSegment(currentStation.location, station.location, location);
      return {
        station1: currentStation,
        station2: station,
        location: nearestPoint.location,
        distance: nearestPoint.distance,
      };
    })
    .filter(isNotNil);
  const best = minBy(distances, (d) => d.distance);
  return best ?? null;
}
