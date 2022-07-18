import { DateTime, DurationLike } from 'luxon';

import { useTrainDataStore } from '@/stores/trainData';
import { timetableRowFixture } from '@/test/timetablerow.fixture';
import { trainFixture } from '@/test/train.fixture';
import { trainLocationFixture } from '@/test/trainLocation.fixture';
import { StationCollection } from '@/types/Station';
import { StopType, TimetableRow } from '@/types/Train';
import { adjustTimetableByLocation, isTrainAtStation } from '@/utils/timetableCalculation';

describe('timetable calculation', () => {
  it('uses original times when location not available', () => {
    const train = trainFixture();

    const adjusted = adjustTimetableByLocation(train, null);

    expect(adjusted.timetableRows).toEqual(train.timetableRows);
  });

  it('uses original times when location is old', () => {
    const train = trainFixture();
    const location = trainLocationFixture({
      timestamp: DateTime.now().minus({ minutes: 1.5 }),
    });

    const adjusted = adjustTimetableByLocation(train, location);

    expect(adjusted.timetableRows).toEqual(train.timetableRows);
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
    train.timetableRows[1].stopType = StopType.OtherTraffic;
    train.timetableRows[2].stopType = StopType.OtherTraffic;

    const isAtStation = isTrainAtStation(train, null);

    expect(isAtStation).toBe(true);
  });

  it("is not at station when arrival time has passed and it's not actual", () => {
    const train = trainFixture({
      latestActualTimeIndex: 0,
      timetableRows: rowsForTest({ minutes: -10 }, { minutes: 2 }).map(timetableRowFixture),
    });
    train.timetableRows[1].stopType = StopType.OtherTraffic;
    train.timetableRows[2].stopType = StopType.OtherTraffic;

    const isAtStation = isTrainAtStation(train, null);

    expect(isAtStation).toBe(false);
  });

  it('is not at station when has no actual time for arrival', () => {
    const train = trainFixture({
      latestActualTimeIndex: 0,
      timetableRows: rowsForTest({ minutes: -8 }, { minutes: 2 }).map(timetableRowFixture),
    });
    train.timetableRows[1].stopType = StopType.OtherTraffic;
    train.timetableRows[2].stopType = StopType.OtherTraffic;

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
  beforeAll(() => {
    const { setStations } = useTrainDataStore.getState();
    setStations(stations);
  });

  it('is not at station when location is more than 1 km away', () => {
    const train = trainFixture({
      latestActualTimeIndex: 1,
      timetableRows: rowsForTest({ minutes: -10 }, { minutes: 2 }).map(timetableRowFixture),
    });
    train.timetableRows[1].stopType = StopType.OtherTraffic;
    train.timetableRows[2].stopType = StopType.OtherTraffic;
    const location = trainLocationFixture({
      location: {
        lat: 62.110116667,
        lon: 24.505612778,
      },
    });

    const isAtStation = isTrainAtStation(train, location);

    expect(isAtStation).toBe(false);
  });

  it('is at station when location is less than 1 km away', () => {
    const train = trainFixture({
      latestActualTimeIndex: 1,
      timetableRows: rowsForTest({ minutes: -10 }, { minutes: 2 }).map(timetableRowFixture),
    });
    train.timetableRows[1].stopType = StopType.OtherTraffic;
    train.timetableRows[2].stopType = StopType.OtherTraffic;
    const location = trainLocationFixture({
      location: {
        lat: 62.132454167,
        lon: 24.506371111,
      },
    });

    const isAtStation = isTrainAtStation(train, location);

    expect(isAtStation).toBe(true);
  });
});

// function logTimes(rows: TimetableRow[]): void {
//   const times = rows.map((row) => row.time.toISO());
//   console.log(times, DateTime.now().toISO());
// }

function rowsForTest(
  departureRelativeToNow: DurationLike,
  firstStopDuration: DurationLike = { minutes: 0 }
): TimetableRow[] {
  const now = DateTime.now();
  const departureFromOrigin = now.plus(departureRelativeToNow);
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
      time: departureFromOrigin,
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
      stopType: StopType.None,
      time: firstStopping,
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
      stopType: StopType.None,
      time: firstStopDeparture,
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
      time: finalStop,
    },
  ];
}
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
