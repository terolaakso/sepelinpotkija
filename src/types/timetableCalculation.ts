import _ from 'lodash';
import { DateTime, Duration } from 'luxon';

import { getLocationFromContext, TrainContextProps } from '@/components/TrainData';
import {
  distanceBetweenCoordsInKm,
  LatLon,
  nearestPointSegment,
  StationSegmentLocation,
} from '@/utils/geography';
import { isNotNil } from '@/utils/misc';

import { calculateCauses } from './lateCauses';
import { Station, StationCollection } from './Station';
import { StopType, TimetableRow, Train } from './Train';
import { TrainLocation } from './TrainLocation';

interface StationIndex {
  index: number;
  station: Station;
}

interface StationSegment extends StationSegmentLocation {
  fromIndex: number;
  toIndex: number;
}

export function adjustTimetableByLocation(
  train: Train,
  location: TrainLocation | null,
  stations: StationCollection
): Train {
  const LOCATION_USABLE_MAX_MINUTES = 1;
  if (
    !location ||
    DateTime.now().diff(location.timestamp).as('minutes') > LOCATION_USABLE_MAX_MINUTES
  ) {
    return train;
  }
  const filledWithNewData: Train = {
    ...train,
    lateMinutes: calculateLateMins(train.timetableRows, train.latestActualTimeIndex),
    currentSpeed: location.speed,
  };
  if (isTrainAtStation(filledWithNewData, location, stations)) {
    const withoutLocationAdjustment = resetTimes(filledWithNewData);
    return withoutLocationAdjustment;
  }
  const segment = findClosestStationSegment(filledWithNewData, location, stations);
  if (!segment) {
    return filledWithNewData;
  }
  const fixed = fixTimetable(filledWithNewData, location, segment);
  const result: Train = {
    ...filledWithNewData,
    timetableRows: fixTimesInWrongOrder(fixed, segment.fromIndex),
    lateMinutes: calculateLateMins(fixed, filledWithNewData.latestActualTimeIndex),
  };
  return result;
}

function fixTimesInWrongOrder(rows: TimetableRow[], fixFromIndex: number): TimetableRow[] {
  console.log(new Date().toLocaleTimeString(), 'Fixing times in wrong order', fixFromIndex);
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
export function isTrainAtStation(
  train: Train,
  location: TrainLocation,
  stations: StationCollection
): boolean {
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
  if (actualIndex >= 0 && actualIndex + 1 < rows.length) {
    console.log(
      new Date().toLocaleTimeString(),
      'index',
      actualIndex,
      'actualRow',
      rows[actualIndex].stationShortCode,
      'nextRow',
      rows[actualIndex + 1].stationShortCode,
      'nextTime',
      rows[actualIndex + 1].bestDigitrafficTime.toFormat('HH:mm:ss'),
      'train',
      train.trainNumber
    );
  }
  // const result = isAtStationAccordingToTime || isAtStationAccordingToActualTime;
  const result = isAtStationAccordingToActualTime;
  if (result && location) {
    const station = stations[rows[Math.max(actualIndex, 0)].stationShortCode];
    if (station) {
      const distance = distanceBetweenCoordsInKm(location.location, station.location);
      if (isAtStationAccordingToActualTime) {
        console.log(
          new Date().toLocaleTimeString(),
          'Train is at station',
          distance,
          isAtStationAccordingToActualTime
        );
      }
      return distance < MAX_STATION_RANGE_KM;
    }
  }
  if (result) {
    console.log(
      new Date().toLocaleTimeString(),
      'Train is at station',
      isAtStationAccordingToActualTime
    );
  }
  return result;
}

function resetTimes(train: Train): Train {
  return {
    ...train,
    timetableRows: train.timetableRows.map((row) => ({
      ...row,
      time: row.bestDigitrafficTime,
    })),
  };
}

export function calculateLateMins(
  rows: TimetableRow[],
  latestActualTimeIndex: number
): number | null {
  if (latestActualTimeIndex < 0) {
    return null;
  }
  const nextRowIndex = Math.min(latestActualTimeIndex + 1, rows.length - 1);
  const row = rows[nextRowIndex];
  const lateMins = Math.round(row.time.diff(row.scheduledTime).as('minutes'));
  return lateMins;
}

// function digitrafficTime(row: TimetableRow): DateTime {
//   return row.actualTime ?? row.estimatedTime ?? row.scheduledTime;
// }

function findClosestFutureStation(
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
  const station = stations[train.timetableRows[i].stationShortCode];
  if (i >= 0 && isNotNil(station)) {
    return {
      index: i,
      station: station,
    };
  }
  return null;
}

function findNextStation(train: Train, index: number, stations: StationCollection) {
  const i = _.findIndex(
    train.timetableRows,
    (row) => row.stationShortCode !== train.timetableRows[index].stationShortCode,
    index + 1
  );
  if (i >= 0 && i < train.timetableRows.length) {
    return {
      index: i,
      station: stations[train.timetableRows[i].stationShortCode],
    };
  }
  return null;
}

function findClosestStationSegment(
  train: Train,
  location: TrainLocation,
  stations: StationCollection
): StationSegment | null {
  const closestStation = findClosestFutureStation(train, location.location, stations);
  const previousStation = findPreviousStation(train, closestStation.index, stations);
  const previousSegment = previousStation
    ? nearestPointSegment(
        previousStation.station.location,
        closestStation.station.location,
        location.location
      )
    : null;
  const nextStation = findNextStation(train, closestStation.index, stations);
  const nextSegment = nextStation?.station
    ? nearestPointSegment(
        closestStation.station.location,
        nextStation.station.location,
        location.location
      )
    : null;
  if (
    previousStation &&
    previousSegment &&
    previousSegment?.distance < (nextSegment?.distance ?? Number.MAX_VALUE)
  ) {
    return {
      ...previousSegment,
      fromIndex: previousStation.index,
      toIndex: previousStation.index + 1,
    };
  }
  if (nextStation && nextSegment) {
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
): TimetableRow[] {
  const fixedBeforeStation = doStoppedBeforeStationFix(
    train.timetableRows,
    location,
    segment.toIndex
  );
  if (fixedBeforeStation) {
    console.log(
      new Date().toLocaleTimeString(),
      train.trainNumber,
      'Did stopped before station fix'
    );
    return fixedBeforeStation;
  }
  const pastTimesFixed = doPastTimesFix(train, location, segment);
  const allTimesFixed = doFutureTimesFix(pastTimesFixed, location, segment);

  return allTimesFixed;
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
    for (let i = toIndex + 1; i < rows.length; i++) {
      const row = rows[i];
      if (i === toIndex + 1) {
        result[i] = {
          ...row,
          time: location.timestamp,
        };
      } else {
        const duration = row.bestDigitrafficTime.diff(result[i - 1].bestDigitrafficTime);
        result[i] = {
          ...row,
          time: result[i - 1].time.plus(duration),
        };
      }
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
  const smallestFixedIndex = Math.min(train.latestActualTimeIndex, segment.fromIndex);
  const result: TimetableRow[] = [...train.timetableRows];
  for (let i = segment.fromIndex; i >= smallestFixedIndex; i--) {
    const row = result[i];
    if (i === segment.fromIndex) {
      const duration = result[i + 1].bestDigitrafficTime
        .diff(row.bestDigitrafficTime)
        .mapUnits((x) => x * segment.location);
      const roundedDuration = floorDurationToSeconds(duration);
      result[i] = {
        ...row,
        time: location.timestamp.minus(roundedDuration),
      };
      console.log(new Date().toLocaleTimeString(), train.trainNumber, 'Did past times fix');
    } else {
      const duration = result[i + 1].bestDigitrafficTime.diff(row.bestDigitrafficTime);
      result[i] = {
        ...row,
        time: result[i + 1].time.minus(duration),
      };
    }
  }
  return result;
}

function doFutureTimesFix(
  rows: TimetableRow[],
  location: TrainLocation,
  segment: StationSegment
): TimetableRow[] {
  const result: TimetableRow[] = [...rows];
  let trainStoppingBeforeSchedule = false;
  for (let i = segment.toIndex; i < result.length; i++) {
    const row = result[i];
    if (trainStoppingBeforeSchedule) {
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
      console.log(new Date().toLocaleTimeString(), '?', 'Did future times fix');
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
      trainStoppingBeforeSchedule = true;
    }
  }
  return result;
}

function floorDurationToSeconds(duration: Duration): Duration {
  return Duration.fromDurationLike({
    seconds: Math.floor(duration.as('seconds')),
  });
}

export function fillNewTrainWithDetails(train: Train, context: TrainContextProps): Train {
  const location = getLocationFromContext(train.departureDate, train.trainNumber, context);
  const fixedTrain = location
    ? adjustTimetableByLocation(train, location, context.stations)
    : train;
  const trainWithLateCauses: Train = {
    ...fixedTrain,
    currentLateCauses: calculateCauses(
      fixedTrain,
      context.firstLevelCauses,
      context.secondLevelCauses,
      context.thirdLevelCauses
    ),
  };
  return trainWithLateCauses;
}
