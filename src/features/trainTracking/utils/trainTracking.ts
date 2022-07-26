import { findIndex, findLastIndex, sortBy, sortedUniqBy, uniqBy } from 'lodash';
import { DateTime, DurationLike } from 'luxon';

import { useTrainDataStore } from '@/stores/trainData';
import { StopType, TimetableRow, Train } from '@/types/Train';
import { isNotNil } from '@/utils/misc';

import { TrainEvent, TrainEventType } from '../types/TrainEvent';

import { getTimetableSegmentIntersection } from './timetableIntersection';

interface EncounterResult {
  train: Train;
  time: DateTime;
}

const VIEW_OTHER_TRAINS_SINCE: DurationLike = { minutes: 5 };
const SHOW_ALL_OTHER_TRAINS_FOR_DURATION: DurationLike = { minutes: 10 };
const TOTAL_TRAIN_EVENT_MAX_COUNT = 3;
const PAST_EVENT_MIN_COUNT = 1;

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
  // TODO: Generate infos for "extra" stations
  const uniqueStations = uniqBy([...commercialStops, ...allStations], (row) => row.id);

  const encounters = getOtherTrains(train);
  const stationsWithTrains = mergeTrains(uniqueStations, encounters.result);

  const sortedEvents = sortBy(stationsWithTrains, (row) => row.time);
  const withCountdown = calculateCountdown(sortedEvents);
  return { events: withCountdown, nextStationCode, nextTrain: encounters.nextTrain };
}

export function getCurrentCommercialStops(train: Train, nextRowIndex: number): TrainEvent[] {
  return getStops(train, nextRowIndex, (row) => row.stopType === StopType.Commercial, false);
}

export function getCurrentStations(train: Train, nextRowIndex: number): TrainEvent[] {
  return getStops(train, nextRowIndex, () => true, true);
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

function createTimetableRowEvent(rows: TimetableRow[], index: number): TrainEvent {
  const stations = useTrainDataStore.getState().stations;
  const row = rows[index];
  const departureTime =
    index > 0 && index + 1 < rows.length && +row.time !== +rows[index + 1].time
      ? rows[index + 1].time
      : null;
  return {
    id: row.stationShortCode,
    name: stations[row.stationShortCode]?.name ?? row.stationShortCode,
    time: row.time,
    departureTime,
    eventType: row.stopType === StopType.Commercial ? TrainEventType.Stop : TrainEventType.Station,
    lineId: null,
    lateMinutes: null,
    lateCauses: [],
    countdown: '',
    relativeProgress: 0,
    subEvents: [],
  };
}

function createTrainEvent(train: Train, time: DateTime): TrainEvent {
  const stations = useTrainDataStore.getState().stations;
  const origin = stations[train.timetableRows[0].stationShortCode]?.name ?? '';
  const destination =
    stations[train.timetableRows[train.timetableRows.length - 1].stationShortCode]?.name ?? '';
  return {
    countdown: '',
    departureTime: null,
    eventType: TrainEventType.Train,
    id: train.trainNumber.toString(),
    lateMinutes: train.lateMinutes,
    lateCauses: train.currentLateCauses,
    lineId: train.lineId,
    name: `${train.name} ${origin} - ${destination}`,
    relativeProgress: 0,
    subEvents: [],
    time,
  };
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

function getStops(
  train: Train,
  nextRowIndex: number,
  criteria: (row: TimetableRow) => boolean,
  includePast: boolean
): TrainEvent[] {
  const rows = train.timetableRows;
  const previous = findPrevious(rows, nextRowIndex, criteria, includePast);
  const current = findCurrent(rows, nextRowIndex, criteria, includePast);
  const next = findNext(rows, nextRowIndex, criteria, includePast);
  return [previous, current, next].filter(isNotNil);
}

function findPrevious(
  rows: TimetableRow[],
  nextRowIndex: number,
  criteria: (row: TimetableRow) => boolean,
  includePast: boolean
): TrainEvent | null {
  if (includePast && nextRowIndex > 0 && nextRowIndex < rows.length) {
    const stepToPrevious =
      nextRowIndex < rows.length &&
      rows[nextRowIndex].stationShortCode === rows[nextRowIndex - 1].stationShortCode
        ? 2
        : 1;
    const index = findLastIndex(
      rows,
      (row, i) =>
        criteria(row) &&
        (i === 0 || i + 1 >= rows.length || row.stationShortCode === rows[i + 1].stationShortCode),
      nextRowIndex - stepToPrevious
    );
    if (index >= 0) {
      return createTimetableRowEvent(rows, index);
    }
  }
  return null;
}

function findCurrent(
  rows: TimetableRow[],
  nextRowIndex: number,
  criteria: (row: TimetableRow) => boolean,
  includePast: boolean
): TrainEvent | null {
  if (
    nextRowIndex === 0 ||
    (nextRowIndex >= rows.length && includePast) ||
    (nextRowIndex < rows.length &&
      criteria(rows[nextRowIndex]) &&
      rows[nextRowIndex].stationShortCode === rows[nextRowIndex - 1].stationShortCode)
  ) {
    const arrivalIndex = nextRowIndex === 0 ? 0 : nextRowIndex - 1;
    return createTimetableRowEvent(rows, arrivalIndex);
  }
  return null;
}

function findNext(
  rows: TimetableRow[],
  nextRowIndex: number,
  criteria: (row: TimetableRow) => boolean,
  includePast: boolean
): TrainEvent | null {
  const index = findIndex(
    rows,
    (row, i) =>
      criteria(row) && i - 1 >= 0 && rows[i - 1].stationShortCode !== row.stationShortCode,
    nextRowIndex
  );
  if (index >= 0) {
    return createTimetableRowEvent(rows, index);
  }
  if (includePast) {
    // TODO: something with includePast
  }
  return null;
}

function getOtherTrains(forTrain: Train): { result: TrainEvent[]; nextTrain: Train | null } {
  const otherTrains = Object.values(useTrainDataStore.getState().trains).filter(
    (train): train is Train =>
      isNotNil(train) &&
      (train.trainNumber !== forTrain.trainNumber || train.departureDate !== forTrain.departureDate)
  );
  const startTime = DateTime.now().minus(VIEW_OTHER_TRAINS_SINCE);
  const rows = forTrain.timetableRows.filter((row) => row.time >= startTime);
  const encounters = otherTrains
    .map((otherTrain) => {
      const encounterTime = trainsIntersectionTime(rows, otherTrain.timetableRows, startTime);
      if (encounterTime && encounterTime >= startTime) {
        return {
          train: otherTrain,
          time: encounterTime,
        };
      }
      return null;
    })
    .filter(isNotNil)
    .sort((a, b) => a.time.toMillis() - b.time.toMillis());
  const filterResult = filterTrains(encounters);
  const encounterEvents = filterResult.result.map((e) => createTrainEvent(e.train, e.time));
  return { result: encounterEvents, nextTrain: filterResult.nextTrain };
}

function trainsIntersectionTime(
  train1Rows: TimetableRow[],
  train2Rows: TimetableRow[],
  startTime: DateTime
): DateTime | null {
  for (let index1 = 0; index1 < train1Rows.length - 1; index1++) {
    const station1 = train1Rows[index1].stationShortCode;
    const station2 = train1Rows[index1 + 1].stationShortCode;

    for (let index2 = 0; index2 < train2Rows.length - 1; index2++) {
      if (train2Rows[index2 + 1].time < startTime) {
        continue;
      }
      if (
        (train2Rows[index2].stationShortCode === station1 &&
          train2Rows[index2 + 1].stationShortCode === station2) ||
        (train2Rows[index2].stationShortCode === station2 &&
          train2Rows[index2 + 1].stationShortCode === station1)
      ) {
        const intersectionTime = getTimetableSegmentIntersection(
          train1Rows[index1].time,
          train1Rows[index1 + 1].time,
          train2Rows[index2].time,
          train2Rows[index2 + 1].time,
          station1 !== station2 && station1 === train2Rows[index2].stationShortCode
        );
        if (intersectionTime) {
          return intersectionTime;
        }
      }
    }
  }
  return null;
}

export function filterTrains(encounters: EncounterResult[]): {
  result: EncounterResult[];
  nextTrain: Train | null;
} {
  const now = DateTime.now();
  const showAllUntil = now.plus(SHOW_ALL_OTHER_TRAINS_FOR_DURATION);

  const past = getEncountersAtOrEarlierThan(encounters, now);
  const nextEncounter = getNextEncounter(encounters, now);
  const future = sortedUniqBy(
    [...nextEncounter, ...getEncountersBetween(encounters, now, showAllUntil)],
    (e) => e.train.trainNumber
  );

  const pastToKeepCount = Math.min(
    Math.max(PAST_EVENT_MIN_COUNT, TOTAL_TRAIN_EVENT_MAX_COUNT - future.length),
    past.length
  );
  const futureToKeepCount = Math.min(TOTAL_TRAIN_EVENT_MAX_COUNT - pastToKeepCount, future.length);
  const result = [...past.slice(-pastToKeepCount), ...future.slice(0, futureToKeepCount)];
  return {
    result,
    nextTrain: nextEncounter.length > 0 ? nextEncounter[0].train : null,
  };
}

function getEncountersAtOrEarlierThan(
  encounters: EncounterResult[],
  timestamp: DateTime
): EncounterResult[] {
  return encounters.filter((e) => e.time <= timestamp);
}

function getNextEncounter(encounters: EncounterResult[], timestamp: DateTime): EncounterResult[] {
  const next = encounters.find((e) => e.time > timestamp);
  return next ? [next] : [];
}

function getEncountersBetween(
  encounters: EncounterResult[],
  fromTime: DateTime,
  toTime: DateTime
): EncounterResult[] {
  return encounters.filter((e) => e.time > fromTime && e.time <= toTime);
}

function mergeTrains(stations: TrainEvent[], encounters: TrainEvent[]): TrainEvent[] {
  const result = encounters.reduce(
    (acc, cur) => {
      const matchingIndex = stations.findIndex(
        (s) =>
          (s.departureTime && s.time <= cur.time && s.departureTime >= cur.time) ||
          (!s.departureTime && s.time.toMillis() === cur.time.toMillis())
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
