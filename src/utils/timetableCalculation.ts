import _ from 'lodash';
import { DateTime, Duration } from 'luxon';

import { calculateCauses } from '@/features/lateCauses';
import { useTrainDataStore } from '@/stores/trainData';
import {
  distanceBetweenCoordsInKm,
  LatLon,
  nearestPointSegment,
  StationSegmentLocation,
} from '@/utils/geography';
import { isNotNil } from '@/utils/misc';

import { Station, StationCollection } from '../types/Station';
import { StopType, TimetableRow, Train } from '../types/Train';
import { TrainLocation } from '../types/TrainLocation';

interface StationIndex {
  index: number;
  station: Station;
}

interface StationSegment extends StationSegmentLocation {
  fromIndex: number;
  toIndex: number;
}

const LOCATION_USABLE_MAX_MINUTES = 1;
const MAX_ALLOWED_GPS_DISTANCE_KM = 10;

export function adjustTimetableByLocation(train: Train, location: TrainLocation | null): Train {
  if (
    !location ||
    DateTime.now().diff(location.timestamp).as('minutes') > LOCATION_USABLE_MAX_MINUTES
  ) {
    return train;
  }
  const segment = findClosestStationSegment(train, location);
  if (isTrainAtStation(train, location)) {
    const rowsWithoutLocationAdjustment = resetTimes(train.timetableRows);
    return createTrainFromNewData(
      train,
      rowsWithoutLocationAdjustment,
      location,
      isNotNil(segment) ? segment.fromIndex : null
    );
  }
  if (!segment) {
    return createTrainFromNewData(train, train.timetableRows, location, null);
  }
  const { fixedRows, fixedFromIndex } = fixTimetable(train, location, segment);
  const result = createTrainFromNewData(
    train,
    fixTimesInWrongOrder(fixedRows, segment.fromIndex),
    location,
    fixedFromIndex
  );
  return result;
}

function createTrainFromNewData(
  train: Train,
  rows: TimetableRow[],
  location: TrainLocation,
  fixedFromIndex: number | null
): Train {
  return {
    ...train,
    timetableRows: rows,
    lateMinutes: calculateLateMins(rows, (fixedFromIndex ?? train.latestActualTimeIndex) + 1),
    currentSpeed: location.speed,
    currentLateCauses: calculateCauses(rows, (fixedFromIndex ?? train.latestActualTimeIndex) + 1),
    latestGpsIndex: fixedFromIndex,
  };
}

function fixTimesInWrongOrder(rows: TimetableRow[], fixFromIndex: number): TimetableRow[] {
  const result: TimetableRow[] = [...rows];
  for (let i = fixFromIndex - 1; i >= 0; i--) {
    const row = result[i];
    const nextTime = result[i + 1].time;
    if (row.time > nextTime) {
      result[i] = {
        ...row,
        time: nextTime,
      };
    }
  }
  return result;
}

/**
 * According to times from Digitraffic, the train is at the station based on the current time,
 *  and if we have a GPS location, it is not more than 1 km from the station.
 */
export function isTrainAtStation(train: Train, location: TrainLocation | null): boolean {
  const MAX_STATION_RANGE_KM = 1;
  const now = DateTime.now();
  const rows = train.timetableRows;
  const actualIndex = train.latestActualTimeIndex;
  const isAtStationAccordingToActualTime =
    (actualIndex === -1 && now < rows[0].bestDigitrafficTime) ||
    actualIndex === rows.length - 1 ||
    (actualIndex >= 0 &&
      actualIndex + 1 < rows.length &&
      rows[actualIndex].stationShortCode === rows[actualIndex + 1].stationShortCode &&
      rows[actualIndex].stopType !== StopType.None &&
      now < rows[actualIndex + 1].bestDigitrafficTime);
  const result = isAtStationAccordingToActualTime;
  if (result && location) {
    const stations = useTrainDataStore.getState().stations;
    const station = stations[rows[Math.max(actualIndex, 0)].stationShortCode];
    if (station) {
      const distance = distanceBetweenCoordsInKm(location.location, station.location);
      return distance < MAX_STATION_RANGE_KM;
    }
  }
  return result;
}

function resetTimes(rows: TimetableRow[]): TimetableRow[] {
  return rows.map((row) => ({
    ...row,
    time: row.bestDigitrafficTime,
  }));
}

export function calculateLateMins(rows: TimetableRow[], index: number): number | null {
  if (index <= 0) {
    // Get latemins only for trains that have departed their origin station
    return null;
  }
  const nextRowIndex = Math.min(index, rows.length - 1);
  const row = rows[nextRowIndex];
  const lateMins = Math.round(row.time.diff(row.scheduledTime).as('minutes'));
  return lateMins;
}

export function findClosestFutureStation(
  train: Train,
  location: LatLon,
  stations: StationCollection
): StationIndex {
  const startIndex = Math.max(train.latestActualTimeIndex, 0);
  const closest = train.timetableRows.slice(startIndex).reduce(
    (acc, row, i) => {
      const code = row.stationShortCode;
      if (code !== acc.prevStation) {
        const station = stations[code];
        if (isNotNil(station)) {
          const distance = distanceBetweenCoordsInKm(station.location, location);
          if (distance < acc.distance) {
            return {
              prevStation: code,
              distance,
              index: startIndex + i,
            };
          }
        }
      }
      return {
        ...acc,
        prevStation: code,
      };
    },
    { index: 0, distance: Infinity, prevStation: '' }
  );
  return {
    index: closest.index,
    station: stations[train.timetableRows[closest.index].stationShortCode] as Station,
  };
}

function findPreviousStation(
  train: Train,
  index: number,
  stations: StationCollection
): StationIndex | null {
  const i = _.findLastIndex(
    train.timetableRows,
    (row) => row.stationShortCode !== train.timetableRows[index].stationShortCode,
    Math.max(index - 1, 0)
  );
  if (i >= 0) {
    const station = stations[train.timetableRows[i].stationShortCode];
    if (isNotNil(station)) {
      return {
        index: i,
        station,
      };
    }
  }
  return null;
}

function findNextStation(
  train: Train,
  index: number,
  stations: StationCollection
): StationIndex | null {
  const i = _.findIndex(
    train.timetableRows,
    (row) => row.stationShortCode !== train.timetableRows[index].stationShortCode,
    index + 1
  );
  if (i >= 0 && i < train.timetableRows.length) {
    const station = stations[train.timetableRows[i].stationShortCode];
    if (isNotNil(station)) {
      return {
        index: i,
        station,
      };
    }
  }
  return null;
}

export function findClosestStationSegment(
  train: Train,
  location: TrainLocation
): StationSegment | null {
  const stations = useTrainDataStore.getState().stations;
  const nearestStation = findClosestFutureStation(train, location.location, stations);
  const previousStation = findPreviousStation(train, nearestStation.index, stations);
  const previousSegment = isNotNil(previousStation)
    ? nearestPointSegment(
        previousStation.station.location,
        nearestStation.station.location,
        location.location
      )
    : null;
  const nextStation = findNextStation(train, nearestStation.index, stations);
  const nextSegment = isNotNil(nextStation)
    ? nearestPointSegment(
        nearestStation.station.location,
        nextStation.station.location,
        location.location
      )
    : null;
  if (
    previousStation &&
    previousSegment &&
    previousSegment.distance <
      Math.min(nextSegment?.distance ?? Number.MAX_VALUE, MAX_ALLOWED_GPS_DISTANCE_KM)
  ) {
    return {
      ...previousSegment,
      fromIndex: previousStation.index,
      toIndex: previousStation.index + 1,
    };
  }
  if (nextStation && nextSegment && nextSegment.distance < MAX_ALLOWED_GPS_DISTANCE_KM) {
    return {
      ...nextSegment,
      fromIndex: nextStation.index - 1,
      toIndex: nextStation.index,
    };
  }
  return null;
}

function fixTimetable(
  train: Train,
  location: TrainLocation,
  segment: StationSegment
): { fixedRows: TimetableRow[]; fixedFromIndex: number } {
  const fixedBeforeStation = doStoppedBeforeStationFix(
    train.timetableRows,
    location,
    segment.toIndex
  );
  if (fixedBeforeStation) {
    return { fixedRows: fixedBeforeStation, fixedFromIndex: segment.toIndex + 1 };
  }
  const pastTimesFixed = doPastTimesFix(train, location, segment);
  const allTimesFixed = doFutureTimesFix(pastTimesFixed, location, segment);

  return { fixedRows: allTimesFixed, fixedFromIndex: segment.toIndex };
}

/**
 * Train is located before the station point and digitraffic departure time has passed.
 */
function doStoppedBeforeStationFix(
  rows: TimetableRow[],
  location: TrainLocation,
  toIndex: number
): TimetableRow[] | null {
  const now = DateTime.now();
  if (
    toIndex + 1 < rows.length &&
    rows[toIndex].stopType !== StopType.None &&
    rows[toIndex].stationShortCode === rows[toIndex + 1].stationShortCode &&
    rows[toIndex + 1].bestDigitrafficTime < now
  ) {
    const result: TimetableRow[] = [...rows];
    result[toIndex + 1] = {
      ...result[toIndex + 1],
      time: location.timestamp,
    };
    for (let i = toIndex + 2; i < rows.length; i++) {
      const row = rows[i];
      const duration = row.bestDigitrafficTime.diff(result[i - 1].bestDigitrafficTime);
      result[i] = {
        ...row,
        time: result[i - 1].time.plus(duration),
      };
    }
    return result;
  }
  return null;
}

function doPastTimesFix(
  train: Train,
  location: TrainLocation,
  segment: StationSegment
): TimetableRow[] {
  const smallestFixedIndex = Math.min(Math.max(train.latestActualTimeIndex, 0), segment.fromIndex);
  const result: TimetableRow[] = [...train.timetableRows];

  const duration = result[segment.fromIndex + 1].bestDigitrafficTime
    .diff(result[segment.fromIndex].bestDigitrafficTime)
    .mapUnits((x) => x * segment.location);
  const roundedDuration = floorDurationToSeconds(duration);
  result[segment.fromIndex] = {
    ...result[segment.fromIndex],
    time: location.timestamp.minus(roundedDuration),
  };

  for (let i = segment.fromIndex - 1; i >= smallestFixedIndex; i--) {
    const row = result[i];
    const duration = result[i + 1].bestDigitrafficTime.diff(row.bestDigitrafficTime);
    result[i] = {
      ...row,
      time: result[i + 1].time.minus(duration),
    };
  }
  return result;
}

function doFutureTimesFix(
  rows: TimetableRow[],
  location: TrainLocation,
  segment: StationSegment
): TimetableRow[] {
  const result: TimetableRow[] = [...rows];
  let isTainStoppingEarlierThanScheduled = false;
  for (let i = segment.toIndex; i < result.length; i++) {
    const row = result[i];
    if (isTainStoppingEarlierThanScheduled) {
      result[i] = {
        ...row,
        time: row.bestDigitrafficTime,
      };
    } else if (i === segment.toIndex) {
      const duration = row.bestDigitrafficTime
        .diff(result[i - 1].bestDigitrafficTime)
        .mapUnits((x) => x * (1 - segment.location));
      const roundedDuration = floorDurationToSeconds(duration);
      result[i] = {
        ...row,
        time: location.timestamp.plus(roundedDuration),
      };
    } else {
      const duration = row.bestDigitrafficTime.diff(result[i - 1].bestDigitrafficTime);
      result[i] = {
        ...row,
        time: result[i - 1].time.plus(duration),
      };
    }
    if (
      row.stopType !== StopType.None &&
      result[i].time < row.bestDigitrafficTime &&
      i > 0 &&
      row.stationShortCode !== rows[i - 1].stationShortCode
    ) {
      isTainStoppingEarlierThanScheduled = true;
    }
  }
  return result;
}

function floorDurationToSeconds(duration: Duration): Duration {
  return Duration.fromDurationLike({
    seconds: Math.floor(duration.as('seconds')),
  });
}

export function adjustWithLocationFromStore(train: Train): Train {
  const location = useTrainDataStore.getState().getLocation(train.departureDate, train.trainNumber);
  const fixedTrain = location ? adjustTimetableByLocation(train, location) : train;
  return fixedTrain;
}

export function timetableExpirationDuration(train: Train): Duration {
  const index = train.latestGpsIndex ? train.latestGpsIndex + 1 : train.latestActualTimeIndex + 1;

  if (index < train.timetableRows.length) {
    const age = DateTime.now().diff(train.timetableRows[index].time);
    return age;
  }
  return Duration.fromMillis(0);
}
