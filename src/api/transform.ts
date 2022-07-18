import _ from 'lodash';
import { DateTime, Duration } from 'luxon';

import {
  Cause,
  GpsLocation,
  Station as DigiTrafficStation,
  TimeTableRow,
  Train as DigiTrafficTrain,
} from '@/types/digitraffic';
import { Station } from '@/types/Station';
import { RowCause, StopType, TimetableRow, TimeType, Train } from '@/types/Train';
import { TrainLocation } from '@/types/TrainLocation';
import { isNotNil } from '@/utils/misc';
import { calculateLateMins } from '@/utils/timetableCalculation';

const ESTIMATE_ERROR_TOLERANCE = 0.5;

export function transformTrains(trains: DigiTrafficTrain[]): Train[] {
  const result = trains.map(transformTrain).filter(isNotNil);
  return result;
}

function getLatestActualTimeIndex(rows: TimetableRow[]): number {
  return _.findLastIndex(rows, (row) => isNotNil(row.actualTime));
}

function transformTrain(train: DigiTrafficTrain): Train | null {
  if (train.cancelled) {
    return null;
  }
  const timetableRows = train.timeTableRows?.map(transformTimetableRow).filter(isNotNil) ?? [];
  const fixedRows = fixTimetableErrors(timetableRows);
  const latestActualTimeIndex = getLatestActualTimeIndex(fixedRows);
  const isReady =
    latestActualTimeIndex < fixedRows.length - 1 &&
    fixedRows[latestActualTimeIndex + 1].isTrainReady;
  const result: Train = {
    trainNumber: train.trainNumber,
    departureDate: train.departureDate,
    name: `${train.trainType} ${train.trainNumber}`,
    timetableRows: fixedRows,
    lineId: train.commuterLineID ?? null,
    currentSpeed: null,
    currentLateCauses: [],
    lateMinutes: calculateLateMins(fixedRows, latestActualTimeIndex),
    isReady,
    latestActualTimeIndex,
    latestGpsIndex: null,
    timestamp: DateTime.now(),
    version: train.version ?? 0,
  };

  return result;
}

function transformTimetableRow(row: TimeTableRow): TimetableRow | null {
  if (row.cancelled || !row.scheduledTime || !row.stationShortCode) {
    return null;
  }
  const scheduledTime = DateTime.fromISO(row.scheduledTime);
  const estimatedTime = row.liveEstimateTime ? DateTime.fromISO(row.liveEstimateTime) : null;
  const actualTime = row.actualTime ? DateTime.fromISO(row.actualTime) : null;
  const bestTime = actualTime ?? estimatedTime ?? scheduledTime;

  const result: TimetableRow = {
    stationShortCode: row.stationShortCode,
    scheduledTime,
    estimatedTime,
    actualTime,
    time: bestTime,
    bestDigitrafficTime: bestTime,
    differenceInMinutes: Math.round(bestTime.diff(scheduledTime).as('minutes')),
    stopType: row.commercialStop
      ? StopType.Commercial
      : row.trainStopping
      ? StopType.OtherTraffic
      : StopType.None,
    isTrainReady: row.trainReady?.accepted ?? false,
    lateCauses: (row.causes ?? []).map(transformCause),
  };
  return result;
}

function transformCause(cause: Cause): RowCause {
  return {
    level1CodeId: cause.categoryCodeId ?? null,
    level2CodeId: cause.detailedCategoryCodeId ?? null,
    level3CodeId: cause.thirdCategoryCodeId ?? null,
  };
}

function fixTimetableErrors(rows: TimetableRow[]): TimetableRow[] {
  const actualsFixed = fixErrorsByType(rows, TimeType.Actual);
  const allTimeTypesFixed = fixErrorsByType(actualsFixed, TimeType.Estimated);
  const pastTimesFixed = fixPastTimesInWrongOrder(allTimeTypesFixed);
  const futureTimesFixed = fixFutureTimesInWrongOrder(pastTimesFixed);
  return futureTimesFixed;
}

function rowTimeType(row: TimetableRow): TimeType {
  if (isNotNil(row.actualTime)) {
    return TimeType.Actual;
  } else if (isNotNil(row.estimatedTime)) {
    return TimeType.Estimated;
  } else if (isNotNil(row.scheduledTime)) {
    return TimeType.Scheduled;
  } else {
    return TimeType.None;
  }
}

function fixErrorsByType(rows: TimetableRow[], fixType: TimeType): TimetableRow[] {
  let isFixing = false;
  const result: TimetableRow[] = [...rows];

  for (let i = result.length - 1; i >= 0; i--) {
    const row = result[i];
    const timeType = rowTimeType(row);
    isFixing = isFixing || timeType === fixType;

    if (
      isFixing &&
      ((fixType === TimeType.Actual && timeType !== TimeType.Actual) ||
        (fixType === TimeType.Estimated && timeType === TimeType.Scheduled))
    ) {
      const nextRow = result[i + 1];
      const isBetweenStations = row.stationShortCode !== nextRow.stationShortCode;
      const durationBetweenRows =
        isBetweenStations || row.stopType === StopType.Commercial
          ? nextRow.scheduledTime.diff(row.scheduledTime)
          : Duration.fromMillis(0);
      const fixedTime = nextRow.time.minus(durationBetweenRows);
      result[i] = {
        ...row,
        time: fixedTime,
        bestDigitrafficTime: fixedTime,
      };
    }
  }
  return result;
}

function fixPastTimesInWrongOrder(rows: TimetableRow[]): TimetableRow[] {
  const latestInThePastIndex = getLatestActualTimeIndex(rows);

  const result: TimetableRow[] = [...rows];

  for (let i = latestInThePastIndex - 1; i >= 0; i--) {
    const row = result[i];
    const nextRow = result[i + 1];
    if (row.time > nextRow.time) {
      result[i] = {
        ...row,
        time: nextRow.time,
        bestDigitrafficTime: nextRow.time,
      };
    }
  }

  return result;
}

function fixFutureTimesInWrongOrder(rows: TimetableRow[]): TimetableRow[] {
  const latestInThePastIndex = getLatestActualTimeIndex(rows);

  const result: TimetableRow[] = [...rows];

  for (let i = Math.max(latestInThePastIndex + 1, 1); i < result.length; i++) {
    const row = result[i];
    const previousRow = result[i - 1];

    const isBetweenStations = row.stationShortCode !== previousRow.stationShortCode;
    const time = isBetweenStations
      ? fixedTimeBetweenStations(previousRow, row)
      : fixedTimeAtStation(previousRow, row);
    result[i] = { ...row, time, bestDigitrafficTime: time };
  }
  return result;
}

function fixedTimeBetweenStations(from: TimetableRow, to: TimetableRow): DateTime {
  const duration = to.time.diff(from.time);
  const scheduledDuration = to.scheduledTime.diff(from.scheduledTime);

  if (!isDurationWithinTolerance(duration, scheduledDuration)) {
    const fromEstimate = from.actualTime ?? from.estimatedTime; // "from" might have actual time, "to" never has
    if (fromEstimate && to.estimatedTime) {
      const estimatedDuration = to.estimatedTime.diff(fromEstimate);
      if (isDurationWithinTolerance(estimatedDuration, scheduledDuration)) {
        return from.time.plus(estimatedDuration);
      }
    }
    return from.time.plus(scheduledDuration);
  }
  return to.time;
}

function isDurationWithinTolerance(duration: Duration, scheduledDuration: Duration): boolean {
  return duration >= scheduledDuration.mapUnits((x) => x * (1 - ESTIMATE_ERROR_TOLERANCE));
}

function fixedTimeAtStation(arrival: TimetableRow, departure: TimetableRow): DateTime {
  const shortestStoppingDuration =
    departure.stopType === StopType.Commercial
      ? Duration.fromMillis(
          Math.min(
            departure.scheduledTime.diff(arrival.scheduledTime).toMillis(),
            Duration.fromDurationLike({ minutes: 1 }).toMillis()
          )
        )
      : Duration.fromMillis(0);
  const earliestDeparture = arrival.time.plus(shortestStoppingDuration);
  if (departure.time < earliestDeparture) {
    return earliestDeparture;
  }
  return departure.time;
}

export function transformLocation(location: GpsLocation): TrainLocation {
  return {
    departureDate: location.departureDate,
    trainNumber: location.trainNumber,
    timestamp: DateTime.fromISO(location.timestamp),
    location: {
      lat: location.location.coordinates[1],
      lon: location.location.coordinates[0],
    },
    speed: location.speed,
  };
}

export function transformStation(station: DigiTrafficStation): Station {
  const nameWithoutUnderscores = station.stationName.replace('_', ' ');
  const asemaIndex = nameWithoutUnderscores.toLowerCase().lastIndexOf(' asema');
  const nameWithoutAsema =
    asemaIndex > -1 && asemaIndex === nameWithoutUnderscores.length - 6
      ? nameWithoutUnderscores.substring(0, asemaIndex)
      : nameWithoutUnderscores;

  return {
    name: nameWithoutAsema,
    shortCode: station.stationShortCode,
    location: {
      lat: station.latitude,
      lon: station.longitude,
    },
  };
}
