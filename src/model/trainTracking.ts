import { DateTime } from "luxon";
import { StopType, TimetableRow, Train } from "./Train";
import _ from "lodash";
import { isNotNil } from "../utils/misc";
import { TrainEvent, TrainEventType } from "./TrainEvent";

export function calculateCurrentEventsForTrain(train: Train) {
  const nextRowIndex = nextTimetableRowIndex(train);
  const commercialStops = getStops(
    train,
    nextRowIndex,
    (row) => row.stopType === StopType.Commercial,
    false
  );
  const allStations = getStops(train, nextRowIndex, () => true, true);
  // TODO: Generate infos for "extra" stations
  // TODO: Encounters
  const rowsForEvents = _.unionBy(
    [...commercialStops, ...allStations],
    (row) => row.stationShortCode
  );
  const sortedRows = _.sortBy(rowsForEvents, (row) => row.time);
  const events = sortedRows.map(createEvent);
  return events;
}

export function calculateCountdown(events: TrainEvent[]): TrainEvent[] {
  const result = events.map((event, i) => {
    const countdown = countdownUntilTime(event.time);
    return {
      ...event,
      countdown,
      relativeProgress: calculateRelativeProgress(
        event.time,
        i > 0 ? events[i - 1].time : null
      ),
    };
  });
  return result;
}

function createEvent(row: TimetableRow): TrainEvent {
  return {
    name: row.stationShortCode,
    time: row.time,
    eventType:
      row.stopType === StopType.Commercial
        ? TrainEventType.Stop
        : TrainEventType.Station,
    lineId: null,
    lateMinutes: null,
    countdown: countdownUntilTime(row.time),
    relativeProgress: calculateRelativeProgress(row.time, null),
  };
}

function calculateRelativeProgress(
  time: DateTime,
  previousTime: DateTime | null
) {
  const now = DateTime.now();
  if (previousTime !== null) {
    if (time >= now && previousTime <= now) {
      return (
        now.diff(previousTime).toMillis() / time.diff(previousTime).toMillis()
      );
    }
    if (time < now) {
      return 1;
    }
  }
  return 0;
}

function countdownUntilTime(time: DateTime): string {
  const untilEvent =
    DateTime.now() <= time ? time.diffNow().toFormat("m.ss") : "";
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
): TimetableRow[] {
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
): TimetableRow | null {
  if (includePast && nextRowIndex < rows.length) {
    const index = _.findLastIndex(
      rows,
      (row, i) =>
        criteria(row) &&
        (i + 1 >= rows.length ||
          row.stationShortCode !== rows[i + 1].stationShortCode),
      nextRowIndex - 1
    );
    if (index >= 0) {
      return rows[index];
    }
  }
  return null;
}

function findCurrent(
  rows: TimetableRow[],
  nextRowIndex: number,
  criteria: (row: TimetableRow) => boolean,
  includePast: boolean
): TimetableRow | null {
  if (
    nextRowIndex === 0 ||
    (nextRowIndex >= rows.length && includePast) ||
    (nextRowIndex < rows.length &&
      criteria(rows[nextRowIndex]) &&
      rows[nextRowIndex].stationShortCode ===
        rows[nextRowIndex - 1].stationShortCode)
  ) {
    const arrivalIndex = nextRowIndex === 0 ? 0 : nextRowIndex - 1;
    return rows[arrivalIndex];
  }
  return null;
}

function findNext(
  rows: TimetableRow[],
  nextRowIndex: number,
  criteria: (row: TimetableRow) => boolean,
  includePast: boolean
): TimetableRow | null {
  const index = _.findIndex(
    rows,
    (row, i) =>
      criteria(row) &&
      i - 1 >= 0 &&
      rows[i - 1].stationShortCode !== row.stationShortCode,
    nextRowIndex
  );
  if (index >= 0) {
    return rows[index];
  }
  return null;
}
