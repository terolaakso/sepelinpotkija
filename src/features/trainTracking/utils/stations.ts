import { findIndex, findLastIndex } from 'lodash';

import { useTrainDataStore } from '@/stores/trainData';
import { StopType, TimetableRow, Train } from '@/types/Train';
import { isNotNil } from '@/utils/misc';

import { TrainEvent, TrainEventType } from '../types/TrainEvent';

export function getCurrentCommercialStops(train: Train, nextRowIndex: number): TrainEvent[] {
  return getStops(train, nextRowIndex, (row) => row.stopType === StopType.Commercial, false);
}

export function getCurrentStations(train: Train, nextRowIndex: number): TrainEvent[] {
  return getStops(train, nextRowIndex, () => true, true);
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
  if (includePast && nextRowIndex > 0 && nextRowIndex <= rows.length) {
    const stepToPrevious =
      nextRowIndex === rows.length ||
      (nextRowIndex < rows.length &&
        rows[nextRowIndex].stationShortCode === rows[nextRowIndex - 1].stationShortCode)
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
    wikiPage: null,
    expiresAt: null,
  };
}
