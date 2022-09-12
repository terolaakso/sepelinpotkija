import { sortedUniqBy } from 'lodash';
import { DateTime, DurationLike } from 'luxon';

import { useTrainDataStore } from '@/stores/trainData';
import { TimetableRow, Train } from '@/types/Train';
import { isNotNil } from '@/utils/misc';
import { timetableExpiresAt } from '@/utils/timetableCalculation';

import { TrainEvent, TrainEventType } from '../types/TrainEvent';

import { getTimetableSegmentIntersection } from './timetableIntersection';

interface EncounterResult {
  train: Train;
  time: DateTime;
}

const VIEW_OTHER_TRAINS_SINCE: DurationLike = { minutes: 10 };
const SHOW_ALL_OTHER_FUTURE_TRAINS_FOR: DurationLike = { minutes: 10 };
const TOTAL_TRAIN_EVENT_MAX_COUNT = 3;
const PAST_EVENT_MIN_COUNT = 1;

export function getOtherTrains(forTrain: Train): { result: TrainEvent[]; nextTrain: Train | null } {
  const otherTrains = Object.values(useTrainDataStore.getState().trains).filter(
    (train): train is Train =>
      isNotNil(train) &&
      (train.trainNumber !== forTrain.trainNumber || train.departureDate !== forTrain.departureDate)
  );
  const startTime = DateTime.now().minus(VIEW_OTHER_TRAINS_SINCE);
  const firstSinceStartTimeIndex = forTrain.timetableRows.findIndex((r) => r.time >= startTime);
  const startIndex =
    firstSinceStartTimeIndex == -1
      ? forTrain.timetableRows.length
      : Math.max(firstSinceStartTimeIndex - 1, 0);
  const rows = forTrain.timetableRows.slice(startIndex);
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
  const showAllUntil = now.plus(SHOW_ALL_OTHER_FUTURE_TRAINS_FOR);

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
    wikiPage: null,
    expiresAt: timetableExpiresAt(train),
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
