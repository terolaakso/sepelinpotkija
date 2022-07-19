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
      timetableRows: rowsForTest({ minutes: -10 }, { minutes: 2 }, { seconds: 30 }).map(
        timetableRowFixture
      ),
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
});

describe('when is train at station when location is not available', () => {
  it('is at station when not departed the origin station', () => {
    const train = trainFixture({
      latestActualTimeIndex: -1,
      timetableRows: rowsForTest({ minutes: 1 }).map(timetableRowFixture),
    });
    train.timetableRows[0].actualTime = null;
    train.timetableRows[1].actualTime = null;
    train.timetableRows[2].actualTime = null;
    train.timetableRows[3].actualTime = null;

    const isAtStation = isTrainAtStation(train, null);

    expect(isAtStation).toBe(true);
  });

  it('is not at station when departure time has passed at the origin station', () => {
    const train = trainFixture({
      latestActualTimeIndex: -1,
      timetableRows: rowsForTest({ minutes: -1 }).map(timetableRowFixture),
    });

    const isAtStation = isTrainAtStation(train, null);

    expect(isAtStation).toBe(false);
  });

  it('is at station when arrived to the final station', () => {
    const train = trainFixture({
      latestActualTimeIndex: 3,
      timetableRows: rowsForTest({ minutes: -25 }).map(timetableRowFixture),
    });
    const isAtStation = isTrainAtStation(train, null);

    expect(isAtStation).toBe(true);
  });

  it('is at station when arrived to the final station even if arrival time has not yet passed', () => {
    const train = trainFixture({
      latestActualTimeIndex: 3,
      timetableRows: rowsForTest({ minutes: -19 }).map(timetableRowFixture),
    });

    const isAtStation = isTrainAtStation(train, null);

    expect(isAtStation).toBe(true);
  });

  it('is at station when has actual time for arrival and departure time has not yet passed', () => {
    const train = trainFixture({
      latestActualTimeIndex: 1,
      timetableRows: rowsForTest({ minutes: -10 }, { minutes: 2 }).map(timetableRowFixture),
    });

    const isAtStation = isTrainAtStation(train, null);

    expect(isAtStation).toBe(true);
  });

  it("is not at station when arrival time has passed and it's not actual", () => {
    const train = trainFixture({
      latestActualTimeIndex: 0,
      timetableRows: rowsForTest({ minutes: -10 }, { minutes: 2 }).map(timetableRowFixture),
    });

    const isAtStation = isTrainAtStation(train, null);

    expect(isAtStation).toBe(false);
  });

  it('is not at station when has no actual time for arrival', () => {
    const train = trainFixture({
      latestActualTimeIndex: 0,
      timetableRows: rowsForTest({ minutes: -8 }, { minutes: 2 }).map(timetableRowFixture),
    });

    const isAtStation = isTrainAtStation(train, null);

    expect(isAtStation).toBe(false);
  });

  it("is not at station when there's no stop in the timetable", () => {
    const train = trainFixture({
      latestActualTimeIndex: 1,
      timetableRows: rowsForTest({ minutes: -10 }, { minutes: 2 }).map(timetableRowFixture),
    });
    train.timetableRows[1].stopType = StopType.None;
    train.timetableRows[2].stopType = StopType.None;

    const isAtStation = isTrainAtStation(train, null);

    expect(isAtStation).toBe(false);
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
      timetableRows: rowsForTest({ minutes: -10 }, { minutes: 2 }).map(timetableRowFixture),
    });
    const location = trainLocationFixture({ location: locations.twoKmSouthOfKLO });

    const isAtStation = isTrainAtStation(train, location);

    expect(isAtStation).toBe(false);
  });

  it('is at station when location is less than 1 km away', () => {
    const train = trainFixture({
      latestActualTimeIndex: 1,
      timetableRows: rowsForTest({ minutes: -10 }, { minutes: 2 }).map(timetableRowFixture),
    });
    const location = trainLocationFixture({ location: locations.halfKmNorthOfKLO });

    const isAtStation = isTrainAtStation(train, location);

    expect(isAtStation).toBe(true);
  });
});

describe('finding the closest station', () => {
  it('starts searching from the beginning when train is not yet departed', () => {
    const train = trainFixture({
      latestActualTimeIndex: -1,
      timetableRows: rowsForTest({ minutes: 1 }, { minutes: 2 }).map(timetableRowFixture),
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
      timetableRows: rowsForTest({ minutes: -12 }, { minutes: 2 }).map(timetableRowFixture),
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
      timetableRows: rowsForTest({ minutes: -12 }, { minutes: 2 }).map(timetableRowFixture),
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
      timetableRows: rowsForTest({ minutes: 1 }, { minutes: 2 }).map(timetableRowFixture),
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

// function logTimes(rows: TimetableRow[]): void {
//   const times = rows.map((row) => [row.time.toISO(), row.bestDigitrafficTime.toISO()]);
//   console.log(times, DateTime.now().toISO());
// }

function rowsForTest(
  departureOffset: DurationLike,
  firstStopDuration: DurationLike = { minutes: 0 },
  gpsFixOffset: DurationLike = { seconds: 0 }
): TimetableRow[] {
  const now = DateTime.now();
  const departureFromOrigin = now.plus(departureOffset);
  const firstLegDuration: DurationLike = { minutes: 9 };
  const firstStopping = departureFromOrigin.plus(firstLegDuration);
  const firstStopDeparture = firstStopping.plus(firstStopDuration);
  const secondLegDuration: DurationLike = { minutes: 11 };
  const finalStop = firstStopDeparture.plus(secondLegDuration);

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
      actualTime: finalStop,
      bestDigitrafficTime: finalStop,
      differenceInMinutes: 0,
      estimatedTime: null,
      isTrainReady: false,
      lateCauses: [],
      scheduledTime: finalStop,
      stationShortCode: 'VLP',
      stopType: StopType.Commercial,
      time: finalStop.plus(gpsFixOffset),
    },
  ];
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
};

const createLocations = <T extends Record<string, LatLon>>(x: T) => x;

const locations = createLocations({
  atHPKStationNorthOfStationPoint: {
    lat: 62.249415598,
    lon: 24.452555689,
  },
  atKLOStationSouthOfStationPoint: {
    lat: 62.125693056,
    lon: 24.507781389,
  },
  twoKmSouthOfKLO: {
    lat: 62.110116667,
    lon: 24.505612778,
  },
  halfKmNorthOfKLO: {
    lat: 62.132454167,
    lon: 24.506371111,
  },
  atVLPStationSouthOfStationPoint: {
    lat: 62.021724722,
    lon: 24.507885556,
  },
});

// {
//   actualTime: DateTime.fromISO(''),
//   bestDigitrafficTime: DateTime.fromISO(''),
//   differenceInMinutes: 0,
//   estimatedTime: DateTime.fromISO(''),
//   isTrainReady: false,
//   lateCauses: [],
//   scheduledTime: DateTime.fromISO(''),
//   stationShortCode: '',
//   stopType: StopType.Commercial,
//   time: DateTime.fromISO(''),
// },
