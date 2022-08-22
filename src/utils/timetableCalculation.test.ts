import { DateTime, Duration, DurationLike } from 'luxon';

import { useTrainDataStore } from '@/stores/trainData';
import { timetableRowFixture } from '@/test/timetablerow.fixture';
import { trainFixture } from '@/test/train.fixture';
import { trainLocationFixture } from '@/test/trainLocation.fixture';
import { StationCollection } from '@/types/Station';
import { StopType, TimetableRow } from '@/types/Train';
import { LatLon } from '@/utils/geography';
import {
  adjustTimetableByLocation,
  findClosestFutureStation,
  findClosestStationSegment,
  isTrainAtStation,
} from '@/utils/timetableCalculation';

describe('timetable adjustment using gps location', () => {
  beforeAll(() => {
    const { setStations } = useTrainDataStore.getState();
    setStations(stations);
  });

  it('uses original times when location not available', () => {
    const train = trainFixture();

    const adjusted = adjustTimetableByLocation(train, null);

    expect(adjusted.timetableRows).toEqual(train.timetableRows);
  });

  it('uses original times when location is old', () => {
    const train = trainFixture();
    const location = trainLocationFixture({ timestamp: DateTime.now().minus({ minutes: 1.5 }) });

    const adjusted = adjustTimetableByLocation(train, location);

    expect(adjusted.timetableRows).toEqual(train.timetableRows);
  });

  it('ignores adjustments by gps location when train is at station', () => {
    const train = trainFixture({
      latestActualTimeIndex: 1,
      timetableRows: rowsForTest(
        { minutes: -10 },
        { firstStopDuration: { minutes: 2 }, gpsFixOffset: { seconds: 30 } }
      ).map(timetableRowFixture),
    });
    const location = trainLocationFixture({ location: locations.atKLOStationSouthOfStationPoint });

    train.timetableRows.forEach((row) => {
      expect(row.time).not.toEqual(row.bestDigitrafficTime);
    });

    const adjusted = adjustTimetableByLocation(train, location);

    adjusted.timetableRows.forEach((row) => {
      expect(row.time).toEqual(row.bestDigitrafficTime);
    });
  });

  it('uses location timestamp as departure time when train stopped before the station point and departure time has passed', () => {
    const train = trainFixture({
      latestActualTimeIndex: -1,
      timetableRows: rowsForTest({ minutes: -12 }, { firstStopDuration: { minutes: 2 } }).map(
        timetableRowFixture
      ),
    });
    const location = trainLocationFixture({ location: locations.atKLOStationNorthOfStationPoint });

    const adjusted = adjustTimetableByLocation(train, location);

    expect(adjusted.timetableRows[0].time).toEqual(adjusted.timetableRows[0].bestDigitrafficTime);
    expect(adjusted.timetableRows[1].time).toEqual(adjusted.timetableRows[1].bestDigitrafficTime);
    expect(adjusted.timetableRows[2].time).toEqual(location.timestamp);
    expect(adjusted.timetableRows[2].time).not.toEqual(
      adjusted.timetableRows[2].bestDigitrafficTime
    );
    expect(adjusted.timetableRows[3].time).toEqual(location.timestamp.plus({ minutes: 11 }));
  });

  it('adjusts the origin start time when not yet departed but depature time has passed', () => {
    const train = trainFixture({
      latestActualTimeIndex: -1,
      timetableRows: rowsForTest({ minutes: -1 }, { firstStopDuration: { minutes: 2 } }).map(
        timetableRowFixture
      ),
    });
    const location = trainLocationFixture({ location: locations.atHPKStationSouthOfStationPoint });

    const adjusted = adjustTimetableByLocation(train, location);

    expect(adjusted.timetableRows[0].time.toMillis()).toBeGreaterThan(
      adjusted.timetableRows[0].bestDigitrafficTime.toMillis()
    );
    expect(adjusted.timetableRows[0].time.toMillis()).toBeLessThan(location.timestamp.toMillis());
    expect(adjusted.timetableRows[1].time.toMillis()).toBeGreaterThan(
      location.timestamp.toMillis()
    );
    expect(adjusted.timetableRows[1].time).not.toEqual(
      adjusted.timetableRows[1].bestDigitrafficTime
    );
    expect(adjusted.timetableRows[1].time.toMillis()).toBeGreaterThan(
      adjusted.timetableRows[0].time.toMillis()
    );
    expect(adjusted.timetableRows[2].time.toMillis()).toBeGreaterThan(
      adjusted.timetableRows[1].time.toMillis()
    );
    expect(adjusted.timetableRows[3].time.toMillis()).toBeGreaterThan(
      adjusted.timetableRows[2].time.toMillis()
    );
  });

  it('adjusts the times backwards all the way to latest actual time', () => {
    const train = trainFixture({
      latestActualTimeIndex: 0,
      timetableRows: rowsForTest({ minutes: -30 }, { firstStopDuration: { minutes: 2 } }).map(
        timetableRowFixture
      ),
    });
    const location = trainLocationFixture({ location: locations.atKLOStationSouthOfStationPoint });

    const adjusted = adjustTimetableByLocation(train, location);

    expect(adjusted.timetableRows[0].time.toMillis()).toBeGreaterThan(
      adjusted.timetableRows[0].bestDigitrafficTime.toMillis()
    );
    expect(adjusted.timetableRows[0].time.toMillis()).toBeLessThan(
      adjusted.timetableRows[1].time.toMillis()
    );
    expect(adjusted.timetableRows[1].time.toMillis()).toBeLessThan(
      adjusted.timetableRows[2].time.toMillis()
    );
    expect(adjusted.timetableRows[2].time.toMillis()).toBeLessThan(location.timestamp.toMillis());
    expect(adjusted.timetableRows[3].time.toMillis()).toBeGreaterThan(
      location.timestamp.toMillis()
    );
  });

  it('does not adjust beyond latest actual time', () => {
    const train = trainFixture({
      latestActualTimeIndex: 1,
      timetableRows: rowsForTest({ minutes: -30 }, { firstStopDuration: { minutes: 2 } }).map(
        timetableRowFixture
      ),
    });
    const location = trainLocationFixture({ location: locations.atKLOStationSouthOfStationPoint });

    const adjusted = adjustTimetableByLocation(train, location);

    expect(adjusted.timetableRows[0].time).toEqual(adjusted.timetableRows[0].bestDigitrafficTime);
    expect(adjusted.timetableRows[0].time.toMillis()).toBeLessThan(
      adjusted.timetableRows[1].time.toMillis()
    );
    expect(adjusted.timetableRows[1].time.toMillis()).toBeGreaterThan(
      adjusted.timetableRows[1].bestDigitrafficTime.toMillis()
    );
    expect(adjusted.timetableRows[1].time.toMillis()).toBeLessThan(
      adjusted.timetableRows[2].time.toMillis()
    );
    expect(adjusted.timetableRows[2].time.toMillis()).toBeLessThan(location.timestamp.toMillis());
    expect(adjusted.timetableRows[3].time.toMillis()).toBeGreaterThan(
      location.timestamp.toMillis()
    );
  });

  it('adjusts an early going train until the next stop', () => {
    const train = trainFixture({
      latestActualTimeIndex: -1,
      timetableRows: rowsForTest({ minutes: -7 }, { firstStopDuration: { minutes: 2 } }).map(
        timetableRowFixture
      ),
    });
    const location = trainLocationFixture({ location: locations.halfKmNorthOfKLO });

    const adjusted = adjustTimetableByLocation(train, location);

    expect(adjusted.timetableRows[0].time.toMillis()).toBeLessThan(
      adjusted.timetableRows[0].bestDigitrafficTime.toMillis()
    );
    expect(adjusted.timetableRows[0].time.toMillis()).toBeLessThan(
      adjusted.timetableRows[1].time.toMillis()
    );
    expect(adjusted.timetableRows[1].time.toMillis()).toBeLessThan(
      adjusted.timetableRows[1].bestDigitrafficTime.toMillis()
    );
    expect(adjusted.timetableRows[1].time.toMillis()).toBeGreaterThan(
      location.timestamp.toMillis()
    );
    expect(adjusted.timetableRows[2].time).toEqual(adjusted.timetableRows[2].bestDigitrafficTime);
    expect(adjusted.timetableRows[3].time).toEqual(adjusted.timetableRows[3].bestDigitrafficTime);
  });

  it('does not generate invalid time sequence when train is moving early', () => {
    const train = trainFixture({
      latestActualTimeIndex: 2,
      timetableRows: rowsForTest({ minutes: -15 }).map(timetableRowFixture),
    });
    const location = trainLocationFixture({ location: locations.twoKmNorthOfVLP });

    const adjusted = adjustTimetableByLocation(train, location);

    for (let i = 0; i < 4 - 1; i++) {
      expect(adjusted.timetableRows[i].time.toMillis()).toBeLessThanOrEqual(
        adjusted.timetableRows[i + 1].time.toMillis()
      );
    }
  });

  it('does not adjust times when location is too far back', () => {
    const train = trainFixture({
      latestActualTimeIndex: 4,
      timetableRows: rowsForTest(
        { minutes: -7 },
        { firstStopDuration: { minutes: 2 }, rowCount: 6 }
      ).map(timetableRowFixture),
    });
    const location = trainLocationFixture({ location: locations.atHPKStationSouthOfStationPoint });

    const adjusted = adjustTimetableByLocation(train, location);

    adjusted.timetableRows.forEach((row) => {
      expect(row.time).toEqual(row.bestDigitrafficTime);
    });
  });

  it('calculates latemins for correct station after correction', () => {
    const train = trainFixture({
      latestActualTimeIndex: 0,
      timetableRows: rowsForTest({ minutes: -7 }, { firstStopDuration: { minutes: 2 } }).map(
        timetableRowFixture
      ),
    });
    train.timetableRows[2].bestDigitrafficTime = train.timetableRows[2].scheduledTime.plus({
      minutes: 15,
    });
    train.timetableRows[3].bestDigitrafficTime = train.timetableRows[3].scheduledTime.plus({
      minutes: 15,
    });
    const location = trainLocationFixture({ location: locations.halfKmNorthOfKLO });

    const adjusted = adjustTimetableByLocation(train, location);

    // Next is KLO, and we are arriving early
    // Departure from KLO will be 15 minutes late
    expect(adjusted.lateMinutes).toBeLessThan(0);
  });

  it('calculates latemins correctly when stopped at station', () => {
    const train = trainFixture({
      latestActualTimeIndex: 1,
      timetableRows: rowsForTest({ minutes: -15 }, { firstStopDuration: { minutes: 2 } }).map(
        timetableRowFixture
      ),
    });
    train.timetableRows[0].bestDigitrafficTime = train.timetableRows[0].scheduledTime.plus({
      minutes: 2,
    });
    train.timetableRows[1].bestDigitrafficTime = train.timetableRows[1].scheduledTime.plus({
      minutes: 4,
    });
    train.timetableRows[2].bestDigitrafficTime = train.timetableRows[2].scheduledTime.plus({
      minutes: 5,
    });
    train.timetableRows[3].bestDigitrafficTime = train.timetableRows[3].scheduledTime.plus({
      minutes: 3,
    });
    const location = trainLocationFixture({ location: locations.atKLOStationSouthOfStationPoint });

    const adjusted = adjustTimetableByLocation(train, location);

    expect(adjusted.lateMinutes).toBe(5);
  });
});

describe('when is train at station when location is not available', () => {
  it('is at station when not departed the origin station', () => {
    const train = trainFixture({
      latestActualTimeIndex: -1,
      timetableRows: rowsForTest({ minutes: 1 }).map(timetableRowFixture),
    });

    const isAtStation = isTrainAtStation(train, null);

    expect(isAtStation).toEqual({ result: true, stationIndex: 0 });
  });

  it('is not at station when departure time has passed at the origin station', () => {
    const train = trainFixture({
      latestActualTimeIndex: -1,
      timetableRows: rowsForTest({ minutes: -1 }).map(timetableRowFixture),
    });

    const isAtStation = isTrainAtStation(train, null);

    expect(isAtStation.result).toBe(false);
  });

  it('is at station when arrived to the final station', () => {
    const train = trainFixture({
      latestActualTimeIndex: 3,
      timetableRows: rowsForTest({ minutes: -25 }).map(timetableRowFixture),
    });
    const isAtStation = isTrainAtStation(train, null);

    expect(isAtStation).toEqual({ result: true, stationIndex: -1 });
  });

  it('is at station when arrived to the final station even if arrival time has not yet passed', () => {
    const train = trainFixture({
      latestActualTimeIndex: 3,
      timetableRows: rowsForTest({ minutes: -19 }).map(timetableRowFixture),
    });

    const isAtStation = isTrainAtStation(train, null);

    expect(isAtStation).toEqual({ result: true, stationIndex: -1 });
  });

  it('is at station when has actual time for arrival and departure time has not yet passed', () => {
    const train = trainFixture({
      latestActualTimeIndex: 1,
      timetableRows: rowsForTest({ minutes: -10 }, { firstStopDuration: { minutes: 2 } }).map(
        timetableRowFixture
      ),
    });

    const isAtStation = isTrainAtStation(train, null);

    expect(isAtStation).toEqual({ result: true, stationIndex: 2 });
  });

  it("is at station when arrival time has passed and it's not actual", () => {
    const train = trainFixture({
      latestActualTimeIndex: 0,
      timetableRows: rowsForTest({ minutes: -10 }, { firstStopDuration: { minutes: 2 } }).map(
        timetableRowFixture
      ),
    });

    const isAtStation = isTrainAtStation(train, null);

    expect(isAtStation).toEqual({ result: true, stationIndex: 2 });
  });

  it('is not at station when has no actual time for arrival', () => {
    const train = trainFixture({
      latestActualTimeIndex: 0,
      timetableRows: rowsForTest({ minutes: -8 }, { firstStopDuration: { minutes: 2 } }).map(
        timetableRowFixture
      ),
    });

    const isAtStation = isTrainAtStation(train, null);

    expect(isAtStation.result).toBe(false);
  });

  it('is not at station when there is no stop in the timetable', () => {
    const train = trainFixture({
      latestActualTimeIndex: 1,
      timetableRows: rowsForTest({ minutes: -10 }, { firstStopDuration: { minutes: 2 } }).map(
        timetableRowFixture
      ),
    });
    train.timetableRows[1].stopType = StopType.None;
    train.timetableRows[2].stopType = StopType.None;

    const isAtStation = isTrainAtStation(train, null);

    expect(isAtStation.result).toBe(false);
  });
});

describe('when is train at station when location is available', () => {
  beforeAll(() => {
    const { setStations } = useTrainDataStore.getState();
    setStations(stations);
  });

  it('is not at station when location is more than 1 km away', () => {
    const train = trainFixture({
      latestActualTimeIndex: 1,
      timetableRows: rowsForTest({ minutes: -10 }, { firstStopDuration: { minutes: 2 } }).map(
        timetableRowFixture
      ),
    });
    const location = trainLocationFixture({ location: locations.twoKmSouthOfKLO });

    const isAtStation = isTrainAtStation(train, location);

    expect(isAtStation.result).toBe(false);
  });

  it('is at station when location is less than 1 km away', () => {
    const train = trainFixture({
      latestActualTimeIndex: 1,
      timetableRows: rowsForTest({ minutes: -10 }, { firstStopDuration: { minutes: 2 } }).map(
        timetableRowFixture
      ),
    });
    const location = trainLocationFixture({ location: locations.halfKmNorthOfKLO });

    const isAtStation = isTrainAtStation(train, location);

    expect(isAtStation).toEqual({ result: true, stationIndex: 2 });
  });
});

describe('finding the closest station', () => {
  it('starts searching from the beginning when train is not yet departed', () => {
    const train = trainFixture({
      latestActualTimeIndex: -1,
      timetableRows: rowsForTest({ minutes: 1 }, { firstStopDuration: { minutes: 2 } }).map(
        timetableRowFixture
      ),
    });

    const closest = findClosestFutureStation(
      train,
      locations.atHPKStationNorthOfStationPoint,
      stations
    );

    expect(closest).toEqual({
      index: 0,
      station: stations['HPK'],
    });
  });

  it('choosest the closest station', () => {
    const train = trainFixture({
      latestActualTimeIndex: 1,
      timetableRows: rowsForTest({ minutes: -12 }, { firstStopDuration: { minutes: 2 } }).map(
        timetableRowFixture
      ),
    });

    const closest = findClosestFutureStation(train, locations.twoKmSouthOfKLO, stations);

    expect(closest).toEqual({
      index: 1,
      station: stations['KLO'],
    });
  });

  it('ignores stations that are earlier than the latest station by actual time', () => {
    const train = trainFixture({
      latestActualTimeIndex: 2,
      timetableRows: rowsForTest({ minutes: -12 }, { firstStopDuration: { minutes: 2 } }).map(
        timetableRowFixture
      ),
    });

    const closest = findClosestFutureStation(
      train,
      locations.atHPKStationNorthOfStationPoint,
      stations
    );

    expect(closest).toEqual({
      index: 2,
      station: stations['KLO'],
    });
  });

  it('searches for the closest station all the way to the final destination', () => {
    const train = trainFixture({
      latestActualTimeIndex: 0,
      timetableRows: rowsForTest({ minutes: 1 }, { firstStopDuration: { minutes: 2 } }).map(
        timetableRowFixture
      ),
    });

    const closest = findClosestFutureStation(
      train,
      locations.atVLPStationSouthOfStationPoint,
      stations
    );

    expect(closest).toEqual({
      index: 3,
      station: stations['VLP'],
    });
  });
});

describe('findig the closest station segment', () => {
  beforeAll(() => {
    const { setStations } = useTrainDataStore.getState();
    setStations(stations);
  });

  const train = trainFixture({
    latestActualTimeIndex: -1,
    timetableRows: rowsForTest({ minutes: -30 }, { firstStopDuration: { minutes: 2 } }).map(
      timetableRowFixture
    ),
  });

  it('train before the origin station', () => {
    const location = trainLocationFixture({ location: locations.atHPKStationNorthOfStationPoint });

    const segment = findClosestStationSegment(train, location);

    expect(segment).toMatchObject({ fromIndex: 0, toIndex: 1, location: 0 });
  });

  it('train after the origin station', () => {
    const location = trainLocationFixture({ location: locations.twoKmSouthOfHPK });

    const segment = findClosestStationSegment(train, location);

    expect(segment).toMatchObject({ fromIndex: 0, toIndex: 1 });
    expect(segment?.location).toBeGreaterThan(0);
    expect(segment?.location).toBeLessThan(0.5);
  });

  it('train before a middle station', () => {
    const location = trainLocationFixture({ location: locations.halfKmNorthOfKLO });

    const segment = findClosestStationSegment(train, location);

    expect(segment).toMatchObject({ fromIndex: 0, toIndex: 1 });
    expect(segment?.location).toBeGreaterThan(0.5);
    expect(segment?.location).toBeLessThan(1);
  });

  it('train after a middle station', () => {
    const location = trainLocationFixture({ location: locations.twoKmSouthOfKLO });

    const segment = findClosestStationSegment(train, location);

    expect(segment).toMatchObject({ fromIndex: 2, toIndex: 3 });
    expect(segment?.location).toBeGreaterThan(0);
    expect(segment?.location).toBeLessThan(0.5);
  });

  it('train before the final station', () => {
    const location = trainLocationFixture({ location: locations.twoKmNorthOfVLP });

    const segment = findClosestStationSegment(train, location);

    expect(segment).toMatchObject({ fromIndex: 2, toIndex: 3 });
    expect(segment?.location).toBeGreaterThan(0.5);
    expect(segment?.location).toBeLessThan(1);
  });

  it('train after the final station', () => {
    const location = trainLocationFixture({ location: locations.atVLPStationSouthOfStationPoint });

    const segment = findClosestStationSegment(train, location);

    expect(segment).toMatchObject({ fromIndex: 2, toIndex: 3, location: 1 });
  });
});

// function logTimes(rows: TimetableRow[]): void {
//   const times = rows.map((row) => [row.time.toISO(), row.scheduledTime.toISO()]);
//   console.log(times, DateTime.now().toISO());
// }

function rowsForTest(
  departureOffset: DurationLike,
  options?: {
    firstStopDuration?: DurationLike;
    gpsFixOffset?: DurationLike;
    rowCount?: number;
  }
): TimetableRow[] {
  const defaultOptions = {
    firstStopDuration: { minutes: 0 },
    gpsFixOffset: { seconds: 0 },
    rowCount: 4,
  };
  const { firstStopDuration, gpsFixOffset, rowCount } = {
    ...defaultOptions,
    ...options,
  };
  const now = DateTime.now();
  const departureFromOrigin = now.plus(departureOffset);
  const firstLegDuration: DurationLike = { minutes: 9 };
  const firstStopping = departureFromOrigin.plus(firstLegDuration);
  const firstStopDeparture = firstStopping.plus(firstStopDuration);
  const secondLegDuration: DurationLike = { minutes: 11 };
  const secondStopping = firstStopDeparture.plus(secondLegDuration);
  const secondStopDuration: DurationLike = { minutes: 1 };
  const secondStopDeparture = secondStopping.plus(secondStopDuration);
  const thirdLegDuration: DurationLike = { minutes: 10 };
  const thirdStop = secondStopDeparture.plus(thirdLegDuration);

  return [
    {
      actualTime: departureFromOrigin,
      bestDigitrafficTime: departureFromOrigin,
      differenceInMinutes: 0,
      estimatedTime: null,
      isTrainReady: false,
      lateCauses: [],
      scheduledTime: departureFromOrigin,
      stationShortCode: 'HPK',
      stopType: StopType.Commercial,
      time: departureFromOrigin.plus(gpsFixOffset),
    },
    {
      actualTime: firstStopping,
      bestDigitrafficTime: firstStopping,
      differenceInMinutes: 0,
      estimatedTime: null,
      isTrainReady: false,
      lateCauses: [],
      scheduledTime: firstStopping,
      stationShortCode: 'KLO',
      stopType:
        Duration.fromDurationLike(firstStopDuration).toMillis() === 0
          ? StopType.None
          : StopType.OtherTraffic,
      time: firstStopping.plus(gpsFixOffset),
    },
    {
      actualTime: firstStopDeparture,
      bestDigitrafficTime: firstStopDeparture,
      differenceInMinutes: 0,
      estimatedTime: null,
      isTrainReady: false,
      lateCauses: [],
      scheduledTime: firstStopDeparture,
      stationShortCode: 'KLO',
      stopType:
        Duration.fromDurationLike(firstStopDuration).toMillis() === 0
          ? StopType.None
          : StopType.OtherTraffic,
      time: firstStopDeparture.plus(gpsFixOffset),
    },
    {
      actualTime: secondStopping,
      bestDigitrafficTime: secondStopping,
      differenceInMinutes: 0,
      estimatedTime: null,
      isTrainReady: false,
      lateCauses: [],
      scheduledTime: secondStopping,
      stationShortCode: 'VLP',
      stopType: StopType.Commercial,
      time: secondStopping.plus(gpsFixOffset),
    },
    {
      actualTime: secondStopDeparture,
      bestDigitrafficTime: secondStopDeparture,
      differenceInMinutes: 0,
      estimatedTime: null,
      isTrainReady: false,
      lateCauses: [],
      scheduledTime: secondStopDeparture,
      stationShortCode: 'VLP',
      stopType: StopType.Commercial,
      time: secondStopDeparture.plus(gpsFixOffset),
    },
    {
      actualTime: thirdStop,
      bestDigitrafficTime: thirdStop,
      differenceInMinutes: 0,
      estimatedTime: null,
      isTrainReady: false,
      lateCauses: [],
      scheduledTime: thirdStop,
      stationShortCode: 'KAS',
      stopType: StopType.Commercial,
      time: thirdStop.plus(gpsFixOffset),
    },
  ].slice(0, rowCount);
}

const stations: StationCollection = {
  HPK: {
    name: 'Haapamäki',
    shortCode: 'HPK',
    location: {
      lat: 62.246476,
      lon: 24.455067,
    },
  },
  KLO: {
    name: 'Kolho',
    shortCode: 'KLO',
    location: {
      lat: 62.128049,
      lon: 24.507444,
    },
  },
  VLP: {
    name: 'Vilppula',
    shortCode: 'VLP',
    location: {
      lat: 62.025888,
      lon: 24.506956,
    },
  },
  KAS: {
    name: 'Korkeakoski',
    shortCode: 'KAS',
    location: {
      lat: 61.807686,
      lon: 24.375464,
    },
  },
};

const createLocations = <T extends Record<string, LatLon>>(x: T) => x;

const locations = createLocations({
  atHPKStationNorthOfStationPoint: {
    lat: 62.249415598,
    lon: 24.452555689,
  },
  atHPKStationSouthOfStationPoint: {
    lat: 62.244518611,
    lon: 24.456861944,
  },
  twoKmSouthOfHPK: {
    lat: 62.229846111,
    lon: 24.469100833,
  },
  halfKmNorthOfKLO: {
    lat: 62.132454167,
    lon: 24.506371111,
  },
  atKLOStationNorthOfStationPoint: {
    lat: 62.129304167,
    lon: 24.507260278,
  },
  atKLOStationSouthOfStationPoint: {
    lat: 62.125693056,
    lon: 24.507781389,
  },
  twoKmSouthOfKLO: {
    lat: 62.110116667,
    lon: 24.505612778,
  },
  twoKmNorthOfVLP: {
    lat: 62.043631667,
    lon: 24.502271389,
  },
  atVLPStationSouthOfStationPoint: {
    lat: 62.021724722,
    lon: 24.507885556,
  },
});
