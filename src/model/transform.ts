import { DateTime, Duration } from 'luxon';

import { isNotNil } from '../utils/misc';

import {
  Cause,
  GpsLocation,
  Station as DigiTrafficStation,
  TimeTableRow,
  Train as DigiTrafficTrain,
} from './digitraffic';
import { Station } from './Station';
import { calculateLateMins } from './timetableCalculation';
import { RowCause, StopType, TimetableRow, TimeType, Train } from './Train';
import { TrainLocation } from './TrainLocation';

const ESTIMATE_ERROR_TOLERANCE = 0.5;

export function transformTrains(trains: DigiTrafficTrain[]): Train[] {
  const result = trains.map(transformTrain).filter(isNotNil);
  return result;
}

function transformTrain(train: DigiTrafficTrain): Train | null {
  if (train.cancelled) {
    return null;
  }
  const timetableRows = train.timeTableRows?.map(transformTimetableRow).filter(isNotNil) ?? [];
  const fixedRows = fixTimetableErrors(timetableRows);
  const latestActualTimeIndex = fixedRows.map((r) => r.timeType).lastIndexOf(TimeType.Actual);
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
    timeType: actualTime
      ? TimeType.Actual
      : estimatedTime
      ? TimeType.Estimated
      : TimeType.Scheduled,
    differenceInMinutes:
      row.differenceInMinutes ?? Math.round(bestTime.diff(scheduledTime).as('minutes')),
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
  const futureTimesFixed = fixFutureTimesInWrongOrder(allTimeTypesFixed);
  return [...pastTimesFixed, ...futureTimesFixed];
}

function fixErrorsByType(rows: TimetableRow[], fixType: TimeType): TimetableRow[] {
  let isFixing = false;
  const result: TimetableRow[] = [...rows];

  for (let i = result.length - 1; i >= 0; i--) {
    const row = result[i];
    isFixing = isFixing || row.timeType === fixType;

    if (
      isFixing &&
      ((fixType === TimeType.Actual && row.timeType !== TimeType.Actual) ||
        (fixType === TimeType.Estimated && row.timeType === TimeType.Scheduled))
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
  const latestInThePastIndex = rows.map((r) => r.timeType).lastIndexOf(TimeType.Actual);

  const pastRows: TimetableRow[] = [...rows];

  for (let i = latestInThePastIndex - 1; i >= 0; i--) {
    const row = pastRows[i];
    const nextRow = pastRows[i + 1];
    if (row.time > nextRow.time) {
      pastRows[i] = {
        ...row,
        time: nextRow.time,
        bestDigitrafficTime: nextRow.time,
      };
    }
  }

  return pastRows;
}

function fixFutureTimesInWrongOrder(rows: TimetableRow[]): TimetableRow[] {
  const latestInThePastIndex = rows.map((r) => r.timeType).lastIndexOf(TimeType.Actual);

  const futureRows: TimetableRow[] = [...rows];

  for (let i = Math.max(latestInThePastIndex + 1, 1); i < futureRows.length; i++) {
    const row = futureRows[i];
    const previousRow = futureRows[i - 1];

    const isBetweenStations = row.stationShortCode !== previousRow.stationShortCode;
    const time = isBetweenStations
      ? fixedTimeBetweenStations(previousRow, row)
      : fixedTimeAtStation(previousRow, row);
    futureRows[i] = { ...row, time, bestDigitrafficTime: time };
  }
  return futureRows;
}

function fixedTimeBetweenStations(from: TimetableRow, to: TimetableRow): DateTime {
  const duration = to.time.diff(from.time);
  const scheduledDuration = to.scheduledTime.diff(from.scheduledTime);

  if (!isDurationWithinTolerance(duration, scheduledDuration)) {
    if (from.estimatedTime && to.estimatedTime) {
      const estimatedDuration = to.estimatedTime.diff(from.estimatedTime);
      if (isDurationWithinTolerance(estimatedDuration, scheduledDuration)) {
        return from.time.plus(estimatedDuration);
      }
    }
    return from.time.plus(scheduledDuration);
  }
  return to.time;
}

function isDurationWithinTolerance(duration: Duration, scheduledDuration: Duration): boolean {
  return duration < scheduledDuration.mapUnits((x) => x * (1 - ESTIMATE_ERROR_TOLERANCE));
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
