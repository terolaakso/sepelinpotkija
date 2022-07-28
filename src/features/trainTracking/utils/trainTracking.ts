import { findIndex, sortBy, uniqBy } from 'lodash';
import { DateTime } from 'luxon';

import { Train } from '@/types/Train';

import { TrainEvent, TrainEventType } from '../types/TrainEvent';

import { generateExtras } from './extras';
import { getOtherTrains } from './otherTrains';
import { getCurrentCommercialStops, getCurrentStations } from './stations';

export function calculateCurrentEventsForTrain(train: Train): {
  events: TrainEvent[];
  nextStationCode: string | null;
  nextTrain: Train | null;
} {
  const nextRowIndex = nextTimetableRowIndex(train);
  const commercialStops = getCurrentCommercialStops(train, nextRowIndex);
  const allStations = getCurrentStations(train, nextRowIndex);

  const now = DateTime.now();
  const nextStationCode =
    allStations.find((event) => (event.departureTime ?? event.time) > now)?.id ?? null;

  const extras = generateExtras(allStations);
  const uniqueStations = uniqBy([...extras, ...commercialStops, ...allStations], (row) => row.id);

  const encounters = getOtherTrains(train);
  const stationsWithTrains = mergeTrains(uniqueStations, encounters.result);

  const sortedEvents = sortBy(stationsWithTrains, (row) => row.time);
  const withCountdown = calculateCountdown(sortedEvents);
  return { events: withCountdown, nextStationCode, nextTrain: encounters.nextTrain };
}

function calculateCountdown(events: TrainEvent[]): TrainEvent[] {
  const result = events.map((event, i) => {
    const countdown = countdownUntilTime(getRelevantTimeOfEvent(event));
    const previousEvent = i > 0 ? events[i - 1] : null;
    return {
      ...event,
      countdown,
      relativeProgress: calculateRelativeProgress(
        event.time,
        previousEvent?.departureTime ?? previousEvent?.time ?? null
      ),
    };
  });
  return result;
}

function getRelevantTimeOfEvent(event: TrainEvent): DateTime {
  const now = DateTime.now();
  const time = event.departureTime && event.time < now ? event.departureTime : event.time;
  return time;
}

function calculateRelativeProgress(time: DateTime, previousTime: DateTime | null): number {
  const now = DateTime.now();
  if (previousTime !== null) {
    if (time >= now && previousTime <= now) {
      return now.diff(previousTime).toMillis() / time.diff(previousTime).toMillis();
    }
    if (time < now) {
      return 1;
    }
  }
  return 0;
}

function countdownUntilTime(time: DateTime): string {
  const untilEvent = DateTime.now() <= time ? time.diffNow().toFormat('m.ss') : '';
  return untilEvent;
}

/**
 * Returns the index of the next timetable row according to the current time.
 * If the train is not yet moving, returns 0.
 * If the train is at the final destination, returns the number of timetable rows (index is more than index of the last row).
 */
function nextTimetableRowIndex(train: Train): number {
  const now = DateTime.now();
  const index = findIndex(train.timetableRows, (row) => row.time > now);
  return index >= 0 ? index : train.timetableRows.length;
}

function mergeTrains(stations: TrainEvent[], encounters: TrainEvent[]): TrainEvent[] {
  const result = encounters.reduce(
    (acc, cur) => {
      const matchingIndex = stations.findIndex(
        (s) =>
          (s.eventType === TrainEventType.Stop || s.eventType == TrainEventType.Station) &&
          ((s.departureTime && s.time <= cur.time && s.departureTime >= cur.time) ||
            (!s.departureTime && s.time.toMillis() === cur.time.toMillis()))
      );
      if (matchingIndex >= 0) {
        const station = acc.stationEvents[matchingIndex];
        return {
          ...acc,
          stationEvents: Object.assign([], acc.stationEvents, {
            [matchingIndex]: { ...station, subEvents: [...station.subEvents, cur] },
          }),
        };
      } else {
        return {
          ...acc,
          encountersOnLine: [...acc.encountersOnLine, cur],
        };
      }
    },
    { stationEvents: stations, encountersOnLine: [] as TrainEvent[] }
  );

  return [...result.stationEvents, ...result.encountersOnLine];
}
