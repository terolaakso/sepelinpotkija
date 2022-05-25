import _ from "lodash";
import { DateTime, DurationLike } from "luxon";
import {
  distanceBetweenCoordsInKm,
  LatLon,
  nearestPointSegment,
  StationSegmentLocation,
} from "./geography";
import { Station, StationCollection } from "./Station";
import { StopType, TimetableRow, Train } from "./Train";
import { TrainLocation } from "./TrainLocation";

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
  const LOCATION_USABLE_MAX_AGE: DurationLike = { minutes: 1 };
  if (
    !location ||
    DateTime.now().diff(location.timestamp) > LOCATION_USABLE_MAX_AGE
  ) {
    return train;
  }
  if (isTrainAtStation(train, location, stations)) {
    const withoutLocationAdjustment = resetTimes(train);
    return withoutLocationAdjustment;
  }
  const segment = findClosestStationSegment(train, location, stations);
  if (!segment) {
    return train;
  }
  const fixed = fixTimetable(train, location, segment);
  return fixed;
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
  const prevRowIndex = nextTimetableRowByTimeWithoutCorrectionIndex(train) - 1;
  const rows = train.timetableRows;
  const isAtStationAccordingToDigitrafficTimes =
    prevRowIndex < 0 ||
    prevRowIndex >= rows.length - 1 ||
    (rows[prevRowIndex].stationShortCode ===
      rows[prevRowIndex + 1].stationShortCode &&
      rows[prevRowIndex].stopType !== StopType.None);
  const actualIndex = train.latestActualTimeIndex;
  const isAtStationAccordingToActualTimes =
    (actualIndex === -1 && now < digitrafficTime(rows[0])) ||
    actualIndex === rows.length - 1 ||
    (actualIndex + 1 < rows.length &&
      rows[actualIndex].stationShortCode ===
        rows[actualIndex + 1].stationShortCode &&
      rows[actualIndex].stopType !== StopType.None &&
      now < digitrafficTime(rows[actualIndex + 1]));
  const result =
    isAtStationAccordingToDigitrafficTimes || isAtStationAccordingToActualTimes;
  if (result && location) {
    const station =
      stations[rows[prevRowIndex > 0 ? prevRowIndex : 0].stationShortCode];
    const distance = distanceBetweenCoordsInKm(
      location.location,
      station.location
    );
    return distance < MAX_STATION_RANGE_KM;
  }
  return result;
}

function nextTimetableRowByTimeWithoutCorrectionIndex(train: Train): number {
  const now = DateTime.now();
  const index = _.findIndex(
    train.timetableRows,
    (row) => digitrafficTime(row) > now
  );
  return index >= 0 ? index : train.timetableRows.length;
}

function resetTimes(train: Train): Train {
  return {
    ...train,
    timetableRows: train.timetableRows.map((row) => ({
      ...row,
      time: digitrafficTime(row),
    })),
  };
}

function digitrafficTime(row: TimetableRow): DateTime {
  return row.actualTime ?? row.estimatedTime ?? row.scheduledTime;
}

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
        const distance = distanceBetweenCoordsInKm(station.location, location);
        if (distance < acc.distance) {
          return {
            prevStation: code,
            distance,
            index: startIndex + i,
          };
        }
      }
      return {
        ...acc,
        prevStation: code,
      };
    },
    { index: 0, distance: Infinity, prevStation: "" }
  );
  return {
    index: closest.index,
    station: stations[train.timetableRows[closest.index].stationShortCode],
  };
}

function findPreviousStation(
  train: Train,
  index: number,
  stations: StationCollection
): StationIndex | null {
  const i = _.findLastIndex(
    train.timetableRows,
    (row) =>
      row.stationShortCode !== train.timetableRows[index].stationShortCode,
    index - 1
  );
  if (i >= 0) {
    return {
      index: i,
      station: stations[train.timetableRows[i].stationShortCode],
    };
  }
  return null;
}

function findNextStation(
  train: Train,
  index: number,
  stations: StationCollection
) {
  const i = _.findIndex(
    train.timetableRows,
    (row) =>
      row.stationShortCode !== train.timetableRows[index].stationShortCode,
    index + 1
  );
  if (i < train.timetableRows.length) {
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
  const closestStation = findClosestFutureStation(
    train,
    location.location,
    stations
  );
  const previousStation = findPreviousStation(
    train,
    closestStation.index,
    stations
  );
  const previousSegment = previousStation
    ? nearestPointSegment(
        previousStation.station.location,
        closestStation.station.location,
        location.location
      )
    : null;
  const nextStation = findNextStation(train, closestStation.index, stations);
  const nextSegment = nextStation
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
): Train {
  const fixedBeforeStation = doStoppedBeforeStationFix(
    train,
    location,
    segment.toIndex
  );
  if (fixedBeforeStation) {
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
  train: Train,
  location: TrainLocation,
  toIndex: number
): Train | null {
  const now = DateTime.now();
  const rows = train.timetableRows;
  if (
    toIndex + 1 < rows.length &&
    rows[toIndex].stopType !== StopType.None &&
    rows[toIndex].stationShortCode === rows[toIndex + 1].stationShortCode &&
    digitrafficTime(rows[toIndex + 1]) < now
  ) {
    const fixed = train.timetableRows.map((row, i) => {
      if (i <= toIndex) {
        return row;
      }
      if (i === toIndex + 1) {
        return {
          ...row,
          time: location.timestamp,
        };
      }
      const duration = digitrafficTime(row).diff(digitrafficTime(rows[i - 1]));
      return {
        ...row,
        time: rows[i - 1].time.plus(duration),
      };
    });
    return {
      ...train,
      timetableRows: fixed,
    };
  }
  return null;
}

function doPastTimesFix(
  train: Train,
  location: TrainLocation,
  segment: StationSegment
): Train {
  const fixed: TimetableRow[] = [];
  const firstFixedIndex = Math.min(
    train.latestActualTimeIndex,
    segment.fromIndex
  );
  _.forEachRight(train.timetableRows, (row, i, rows) => {
    if (i > segment.fromIndex) {
      fixed[i] = row;
    } else if (i < firstFixedIndex) {
      fixed[i] = {
        ...row,
        time: DateTime.min(digitrafficTime(row), rows[i + 1].time),
      };
    } else if (i === segment.fromIndex) {
      const duration = digitrafficTime(rows[i + 1])
        .diff(digitrafficTime(row))
        .mapUnits((x) => x * segment.location);
      fixed[i] = {
        ...row,
        time: location.timestamp.minus(duration),
      };
    } else {
      const duration = digitrafficTime(rows[i + 1]).diff(digitrafficTime(row));
      fixed[i] = {
        ...row,
        time: fixed[i + 1].time.minus(duration),
      };
    }
  });
  return {
    ...train,
    timetableRows: fixed,
  };
}

function doFutureTimesFix(
  train: Train,
  location: TrainLocation,
  segment: StationSegment
): Train {
  const fixed: TimetableRow[] = [];
  let trainStoppingBeforeSchedule = false;
  _.forEach(train.timetableRows, (row, i, rows) => {
    if (i < segment.toIndex) {
      fixed[i] = row;
    } else if (trainStoppingBeforeSchedule) {
      fixed[i] = {
        ...row,
        time: digitrafficTime(row),
      };
    } else if (i === segment.toIndex) {
      const duration = digitrafficTime(row)
        .diff(digitrafficTime(rows[i - 1]))
        .mapUnits((x) => x * (1 - segment.location));
      fixed[i] = {
        ...row,
        time: location.timestamp.plus(duration),
      };
    } else {
      const duration = digitrafficTime(row).diff(digitrafficTime(rows[i - 1]));
      fixed[i] = {
        ...row,
        time: fixed[i - 1].time.plus(duration),
      };
    }
    if (
      row.stopType !== StopType.None &&
      fixed[i].time < digitrafficTime(row) &&
      i > 0 &&
      row.stationShortCode !== rows[i - 1].stationShortCode
    ) {
      trainStoppingBeforeSchedule = true;
    }
  });
  return {
    ...train,
    timetableRows: fixed,
  };
}
