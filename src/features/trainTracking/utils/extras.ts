import { findLastIndex, isNil, mapValues } from 'lodash';
import { DateTime } from 'luxon';

import { useTrainDataStore } from '@/stores/trainData';
import { StationCollection } from '@/types/Station';
import { LatLon, nearestPointSegment } from '@/utils/geography';
import { isNotNil } from '@/utils/misc';

import { TrackingEvent, TrainEventType } from '../types/TrackingEvent';
import {
  FileExtras,
  FileTrackSegment,
  FileTrackSegmentCollection,
  LegacyFileExtras,
  LocationExtraInfo,
  TrackSegmentCollection,
} from '../types/TrackSegmentExtras';

export async function loadExtras(stations: StationCollection): Promise<TrackSegmentCollection> {
  const url = '/ratainfo.json';
  const response = await fetch(url);
  const content = (await response.json()) as FileTrackSegmentCollection;
  return mapExtrasFileContents(content, stations);
}

function mapExtrasFileContents(
  infos: FileTrackSegmentCollection,
  stations: StationCollection
): TrackSegmentCollection {
  const result = mapValues(infos, (info, key) => {
    const segmentLocations = info as FileTrackSegment;
    const needsMappingOnly = isNotNil(segmentLocations[0].km);
    const locations = needsMappingOnly
      ? segmentLocations.map(
          (loc, i): LocationExtraInfo => ({
            name: loc.name,
            position: calculateLocationFromKm(segmentLocations as LegacyFileExtras[], i),
            wikiPage: loc.info,
          })
        )
      : segmentLocations.map(
          (loc, i): LocationExtraInfo => ({
            name: loc.name,
            position: calculateLocationFromCoords(
              key,
              segmentLocations as FileExtras[],
              i,
              stations
            ),
            wikiPage: loc.info,
          })
        );
    return { locations };
  });
  return result;
}

function calculateLocationFromKm(
  locationsFromFile: LegacyFileExtras[],
  locationIndex: number
): number {
  const segmentLength =
    locationsFromFile[locationsFromFile.length - 1].km - locationsFromFile[0].km;
  const segmentPortion =
    (locationsFromFile[locationIndex].km - locationsFromFile[0].km) / segmentLength;
  return segmentPortion;
}

function calculateLocationFromCoords(
  key: string,
  locationsFromFile: FileExtras[],
  locationIndex: number,
  stations: StationCollection
): number {
  if (locationIndex === 0) {
    return 0;
  } else if (locationIndex === locationsFromFile.length - 1) {
    return 1;
  }
  const dashPos = key.indexOf('-');
  const firstKey = key.substring(0, dashPos);
  const lastKey = key.substring(dashPos + 1);
  const firstStation = stations[firstKey];
  const lastStation = stations[lastKey];
  const locFromFile = locationsFromFile[locationIndex];
  if (
    isNil(firstStation) ||
    isNil(lastStation) ||
    isNil(locFromFile.lat) ||
    isNil(locFromFile.lon)
  ) {
    console.log(`Ratainfon asemaväli ${key} on virheellinen: ${locFromFile.name}`);
    throw new Error('Failed to parse locations file');
  }
  const firstLatLon: LatLon = {
    lat: firstStation.location.lat,
    lon: firstStation.location.lon,
  };
  const lastLatLon: LatLon = {
    lat: lastStation.location.lat,
    lon: lastStation.location.lon,
  };
  const stationLatLon: LatLon = {
    lat: locFromFile.lat,
    lon: locFromFile.lon,
  };
  const location = nearestPointSegment(firstLatLon, lastLatLon, stationLatLon);
  return location.location;
}

export function generateExtras(items: TrackingEvent[]): TrackingEvent[] {
  const extras = useTrainDataStore.getState().extras;
  let eventsWithExtras: TrackingEvent[] = [];
  for (let i = 0; i + 1 < items.length; i++) {
    const fromItem = items[i];
    const toItem = items[i + 1];
    const segmentExtras = getExtrasForSegment(fromItem.id, toItem.id, extras);
    const segmentEvents = segmentExtras
      .map((extra, j) => {
        if (j === 0) {
          return {
            ...fromItem,
            wikiPage: extra.wikiPage,
          };
        } else if (j === segmentExtras.length - 1) {
          return i === items.length - 2 // last round of i
            ? {
                ...toItem,
                wikiPage: extra.wikiPage,
              }
            : null;
        } else {
          return createLocationExtraEvent(extra, fromItem, toItem);
        }
      })
      .filter(isNotNil);
    eventsWithExtras = eventsWithExtras.concat(segmentEvents);
  }

  if (eventsWithExtras.length === 0) {
    return [];
  }

  const now = DateTime.now();
  const lastInPastIndex = Math.max(
    findLastIndex(eventsWithExtras, (e) => e.time <= now),
    0
  );
  const isLastInPastAStop = isNotNil(eventsWithExtras[lastInPastIndex].departureTime);

  const result = eventsWithExtras.slice(
    isLastInPastAStop ? Math.max(lastInPastIndex - 1, 0) : lastInPastIndex,
    lastInPastIndex + 2
  );
  return result;
}

function getExtrasForSegment(
  fromStationCode: string,
  toStationCode: string,
  extras: TrackSegmentCollection
): LocationExtraInfo[] {
  const isReverse = fromStationCode.localeCompare(toStationCode, 'fi-FI') > 0;
  const key = isReverse
    ? `${toStationCode}-${fromStationCode}`
    : `${fromStationCode}-${toStationCode}`;
  const segment = extras[key];
  if (segment) {
    return isReverse
      ? segment.locations
          .map((l): LocationExtraInfo => ({ ...l, position: 1 - l.position }))
          .reverse()
      : segment.locations;
  }
  return [];
}

function createLocationExtraEvent(
  currentInfo: LocationExtraInfo,
  fromItem: TrackingEvent,
  toItem: TrackingEvent
): TrackingEvent {
  const fromTime = isNotNil(fromItem.departureTime) ? fromItem.departureTime : fromItem.time;
  const segmentDuration = toItem.time.diff(fromTime);
  const segmentPortion = currentInfo.position;

  const result: TrackingEvent = {
    name: currentInfo.name,
    time: fromTime.plus(segmentDuration.mapUnits((x) => x * segmentPortion)),
    eventType: TrainEventType.Detail,
    wikiPage: currentInfo.wikiPage,
    countdown: '',
    departureTime: null,
    id: currentInfo.name,
    lateCauses: [],
    lateMinutes: null,
    lineId: null,
    relativeProgress: 0,
    subEvents: [],
    expiresAt: null,
  };
  return result;
}
