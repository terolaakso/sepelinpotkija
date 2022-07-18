import _ from 'lodash';
import { DateTime } from 'luxon';

import { useTrainDataStore } from '@/stores/trainData';
import { StopType, TimetableRow, Train } from '@/types/Train';
import { isNotNil } from '@/utils/misc';

import { TrainEvent, TrainEventType } from '../types/TrainEvent';

export function calculateCurrentEventsForTrain(train: Train): {
  events: TrainEvent[];
  nextStationCode: string | null;
} {
  const nextRowIndex = nextTimetableRowIndex(train);
  const commercialStops = getCurrentCommercialStops(train, nextRowIndex);
  const allStations = getCurrentStations(train, nextRowIndex);

  const now = DateTime.now();
  const nextStationCode =
    allStations.find((event) => (event.departureTime ?? event.time) > now)?.id ?? null;
  // TODO: Generate infos for "extra" stations
  // TODO: Encounters
  const uniqueEvents = _.unionBy([...commercialStops, ...allStations], (row) => row.id);
  const sortedEvents = _.sortBy(uniqueEvents, (row) => row.time);
  const withCountdown = calculateCountdown(sortedEvents);
  return { events: withCountdown, nextStationCode };
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

function createEvent(rows: TimetableRow[], index: number): TrainEvent {
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
    countdown: '',
    relativeProgress: 0,
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
  const index = _.findIndex(train.timetableRows, (row) => row.time > now);
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
    const index = _.findLastIndex(
      rows,
      (row, i) =>
        criteria(row) &&
        (i === 0 || i + 1 >= rows.length || row.stationShortCode === rows[i + 1].stationShortCode),
      nextRowIndex - stepToPrevious
    );
    if (index >= 0) {
      return createEvent(rows, index);
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
    return createEvent(rows, arrivalIndex);
  }
  return null;
}

function findNext(
  rows: TimetableRow[],
  nextRowIndex: number,
  criteria: (row: TimetableRow) => boolean,
  includePast: boolean
): TrainEvent | null {
  const index = _.findIndex(
    rows,
    (row, i) =>
      criteria(row) && i - 1 >= 0 && rows[i - 1].stationShortCode !== row.stationShortCode,
    nextRowIndex
  );
  if (index >= 0) {
    return createEvent(rows, index);
  }
  if (includePast) {
    // TODO: something with includePast
  }
  return null;
}