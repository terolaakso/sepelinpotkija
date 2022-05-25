import { DateTime, Duration } from "luxon";
import { isNotNil } from "../utils/misc";
import {
  GpsLocation,
  Station as DigiTrafficStation,
  TimeTableRow,
  Train as DigiTrafficTrain,
} from "./digitraffic";
import { Station } from "./Station";
import { StopType, TimetableRow, TimeType, Train } from "./Train";
import { TrainLocation } from "./TrainLocation";

const ESTIMATE_ERROR_TOLERANCE = 0.5;

export function transformTrains(trains: DigiTrafficTrain[]): Train[] {
  const result = trains
    .map(transformTrain)
    .filter(isNotNil)
    .sort((t1, t2) => t1.trainNumber - t2.trainNumber);
  return result;
}

function transformTrain(train: DigiTrafficTrain): Train | null {
  if (train.cancelled) {
    return null;
  }
  const timetableRows =
    train.timeTableRows?.map(transformTimetableRow).filter(isNotNil) ?? [];
  const fixedRows = fixTimetableErrors(timetableRows);
  const latestActualTimeIndex = fixedRows
    .map((r) => r.timeType)
    .lastIndexOf(TimeType.Actual);

  const result: Train = {
    trainNumber: train.trainNumber,
    departureDate: train.departureDate,
    timetableRows: fixedRows,
    currentSpeed: null,
    latestActualTimeIndex,
    latestGpsIndex: null,
    timestamp: DateTime.now(),
  };
  return result;
}

function transformTimetableRow(row: TimeTableRow): TimetableRow | null {
  if (row.cancelled || !row.scheduledTime || !row.stationShortCode) {
    return null;
  }
  const scheduledTime = DateTime.fromISO(row.scheduledTime);
  const estimatedTime = row.liveEstimateTime
    ? DateTime.fromISO(row.liveEstimateTime)
    : null;
  const actualTime = row.actualTime ? DateTime.fromISO(row.actualTime) : null;
  const bestTime = actualTime ?? estimatedTime ?? scheduledTime;

  const result: TimetableRow = {
    stationShortCode: row.stationShortCode,
    scheduledTime,
    estimatedTime,
    actualTime,
    time: bestTime,
    timeType: actualTime
      ? TimeType.Actual
      : estimatedTime
      ? TimeType.Estimated
      : TimeType.Scheduled,
    differenceInMinutes:
      row.differenceInMinutes ??
      Math.round(bestTime.diff(scheduledTime).as("minutes")),
    stopType: row.commercialStop
      ? StopType.Commercial
      : row.trainStopping
      ? StopType.OtherTraffic
      : StopType.None,
  };
  return result;
}

function fixTimetableErrors(rows: TimetableRow[]): TimetableRow[] {
  const actualsFixed = fixErrorsByType(rows, TimeType.Actual);
  const allTimeTypesFixed = fixErrorsByType(actualsFixed, TimeType.Estimated);
  const pastTimesFixed = fixPastTimesInWrongOrder(allTimeTypesFixed);
  const futureTimesFixed = fixFutureTimesInWrongOrder(allTimeTypesFixed);
  return [...pastTimesFixed, ...futureTimesFixed];
}

function fixErrorsByType(
  rows: TimetableRow[],
  fixType: TimeType
): TimetableRow[] {
  let isFixing = false;
  const result: TimetableRow[] = [];

  for (let i = rows.length - 1; i >= 0; i--) {
    const row = rows[i];
    isFixing = isFixing || row.timeType === fixType;

    if (
      isFixing &&
      ((fixType === TimeType.Actual && row.timeType !== TimeType.Actual) ||
        (fixType === TimeType.Estimated && row.timeType === TimeType.Scheduled))
    ) {
      const nextRow = rows[i + 1];
      const isBetweenStations =
        row.stationShortCode !== nextRow.stationShortCode;
      const durationBetweenRows =
        isBetweenStations || row.stopType === StopType.Commercial
          ? nextRow.scheduledTime.diff(row.scheduledTime)
          : Duration.fromMillis(0);
      const fixedTime = nextRow.time.minus(durationBetweenRows);
      result.unshift({ ...row, time: fixedTime });
    } else {
      result.unshift(row);
    }
  }
  return rows;
}

function fixPastTimesInWrongOrder(rows: TimetableRow[]): TimetableRow[] {
  const latestInThePastIndex = rows
    .map((r) => r.timeType)
    .lastIndexOf(TimeType.Actual);

  const pastRows: TimetableRow[] = [];

  for (let i = latestInThePastIndex - 1; i >= 0; i--) {
    const row = rows[i];
    const nextRow = rows[i + 1];
    if (row.time > nextRow.time) {
      pastRows.unshift({
        ...row,
        time: nextRow.time,
      });
    } else {
      pastRows.unshift(row);
    }
  }
  if (latestInThePastIndex >= 0) {
    pastRows.push(rows[latestInThePastIndex]);
  }
  return pastRows;
}

function fixFutureTimesInWrongOrder(rows: TimetableRow[]): TimetableRow[] {
  const latestInThePastIndex = rows
    .map((r) => r.timeType)
    .lastIndexOf(TimeType.Actual);

  const futureRows: TimetableRow[] = [];

  for (let i = Math.max(latestInThePastIndex + 1, 1); i < rows.length; i++) {
    const row = rows[i];
    const previousRow = rows[i - 1];

    const isBetweenStations =
      row.stationShortCode !== previousRow.stationShortCode;
    const time = isBetweenStations
      ? fixedTimeBetweenStations(previousRow, row)
      : fixedTimeAtStation(previousRow, row);
    futureRows.push({ ...row, time });
  }
  return futureRows;
}

function fixedTimeBetweenStations(
  from: TimetableRow,
  to: TimetableRow
): DateTime {
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

function isDurationWithinTolerance(
  duration: Duration,
  scheduledDuration: Duration
): boolean {
  return (
    duration <
    scheduledDuration.mapUnits((x) => x * (1 - ESTIMATE_ERROR_TOLERANCE))
  );
}

function fixedTimeAtStation(
  arrival: TimetableRow,
  departure: TimetableRow
): DateTime {
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
  const nameWithoutUnderscores = station.stationName.replace("_", " ");
  const asemaIndex = nameWithoutUnderscores.toLowerCase().lastIndexOf(" asema");
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
