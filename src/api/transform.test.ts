import { DateTime } from 'luxon';

import { transformTrains } from '@/api/transform';
import { trainFixture } from '@/test/digitraffic.fixture';
import { StopType } from '@/types/Train';

describe('train transformation', () => {
  it('filters out cancelled trains', () => {
    const train = trainFixture({ cancelled: true });
    const transformed = transformTrains([train]);
    expect(transformed).toHaveLength(0);
  });

  it('filters out cancelled rows', () => {
    const train = trainFixture();
    train.timeTableRows[2].cancelled = true;
    train.timeTableRows[3].cancelled = true;

    const [transformed] = transformTrains([train]);

    expect(transformed.timetableRows).toHaveLength(2);
    expect(transformed.timetableRows).toEqual([
      expect.objectContaining({ stationShortCode: 'HPK' }),
      expect.objectContaining({ stationShortCode: 'KLO' }),
    ]);
  });

  it('interprets different row times correctly', () => {
    const train = trainFixture();
    train.timeTableRows[2].actualTime = '2022-07-15T06:10:00.000Z';
    train.timeTableRows[3].actualTime = undefined;
    train.timeTableRows[3].liveEstimateTime = '2022-07-15T06:22:00.000Z';

    const [transformed] = transformTrains([train]);
    const row2 = transformed.timetableRows[2];
    const row3 = transformed.timetableRows[3];

    expect(row2.time).toEqual(row2.actualTime);
    expect(row2.time).not.toEqual(row2.estimatedTime);
    expect(row2.time).toEqual(row2.bestDigitrafficTime);
    expect(row2.differenceInMinutes).toBe(1);

    expect(row3.time).toEqual(row3.estimatedTime);
    expect(row3.time).not.toEqual(row3.actualTime);
    expect(row3.time).toEqual(row3.bestDigitrafficTime);
    expect(row3.differenceInMinutes).toBe(2);

    expect(transformed.latestActualTimeIndex).toBe(2);
  });

  it('fixes missing actual times', () => {
    const train = trainFixture();
    train.timeTableRows[1].actualTime = undefined;
    train.timeTableRows[1].liveEstimateTime = '2022-07-15T06:10:00.000Z';
    train.timeTableRows[2].actualTime = undefined;
    train.timeTableRows[2].liveEstimateTime = '2022-07-15T06:10:00.000Z';
    train.timeTableRows[3].actualTime = '2022-07-15T06:22:00.000Z';

    const [transformed] = transformTrains([train]);

    expect(transformed.timetableRows[1].time).toEqual(DateTime.fromISO('2022-07-15T06:11:00.000Z'));
    expect(transformed.timetableRows[2].time).toEqual(transformed.timetableRows[1].time);
    expect(transformed.timetableRows[3].time).toEqual(DateTime.fromISO('2022-07-15T06:22:00.000Z'));
  });

  it('fixes stopping duration to scheduled duration when actual time missing at commercial stop', () => {
    const train = trainFixture();
    train.timeTableRows[1].scheduledTime = '2022-07-15T06:05:00.000Z';
    train.timeTableRows[1].actualTime = undefined;
    train.timeTableRows[1].liveEstimateTime = '2022-07-15T06:06:00.000Z';
    train.timeTableRows[1].trainStopping = true;
    train.timeTableRows[1].commercialStop = true;
    train.timeTableRows[2].scheduledTime = '2022-07-15T06:07:00.000Z';
    train.timeTableRows[2].actualTime = '2022-07-15T06:10:00.000Z';
    train.timeTableRows[2].liveEstimateTime = undefined;
    train.timeTableRows[2].trainStopping = true;
    train.timeTableRows[2].commercialStop = true;
    train.timeTableRows[3].actualTime = undefined;
    train.timeTableRows[3].liveEstimateTime = '2022-07-15T06:22:00.000Z';

    const [transformed] = transformTrains([train]);

    expect(transformed.timetableRows[1].time).toEqual(DateTime.fromISO('2022-07-15T06:08:00.000Z'));
    expect(transformed.timetableRows[2].time).toEqual(DateTime.fromISO('2022-07-15T06:10:00.000Z'));
    expect(transformed.timetableRows[3].time).toEqual(DateTime.fromISO('2022-07-15T06:22:00.000Z'));
  });

  it('fixes missing estimates', () => {
    const train = trainFixture();
    train.timeTableRows[1].actualTime = undefined;
    train.timeTableRows[1].liveEstimateTime = undefined;
    train.timeTableRows[2].actualTime = undefined;
    train.timeTableRows[2].liveEstimateTime = undefined;
    train.timeTableRows[3].actualTime = undefined;
    train.timeTableRows[3].liveEstimateTime = '2022-07-15T06:22:00.000Z';

    const [transformed] = transformTrains([train]);

    expect(transformed.timetableRows[1].time).toEqual(DateTime.fromISO('2022-07-15T06:11:00.000Z'));
    expect(transformed.timetableRows[2].time).toEqual(transformed.timetableRows[1].time);
    expect(transformed.timetableRows[3].time).toEqual(DateTime.fromISO('2022-07-15T06:22:00.000Z'));
  });

  it('fixes past times in wrong order', () => {
    const train = trainFixture();
    train.timeTableRows[1].actualTime = '2022-07-15T06:10:00.000Z';

    const [transformed] = transformTrains([train]);

    expect(transformed.timetableRows[0].time).toEqual(DateTime.fromISO('2022-07-15T06:00:00.000Z'));
    expect(transformed.timetableRows[1].time).toEqual(DateTime.fromISO('2022-07-15T06:09:00.000Z'));
    expect(transformed.timetableRows[2].time).toEqual(DateTime.fromISO('2022-07-15T06:09:00.000Z'));
    expect(transformed.timetableRows[3].time).toEqual(DateTime.fromISO('2022-07-15T06:20:00.000Z'));
  });

  it('fixes future times with scheduled time when time between stations is too short and estimate is unreasonable', () => {
    const train = trainFixture();
    train.timeTableRows[2].actualTime = '2022-07-15T06:10:00.000Z';
    train.timeTableRows[3].actualTime = undefined;
    train.timeTableRows[3].liveEstimateTime = '2022-07-15T06:15:00.000Z';

    const [transformed] = transformTrains([train]);

    expect(transformed.timetableRows[0].time).toEqual(DateTime.fromISO('2022-07-15T06:00:00.000Z'));
    expect(transformed.timetableRows[1].time).toEqual(DateTime.fromISO('2022-07-15T06:09:00.000Z'));
    expect(transformed.timetableRows[2].time).toEqual(DateTime.fromISO('2022-07-15T06:10:00.000Z'));
    expect(transformed.timetableRows[3].time).toEqual(DateTime.fromISO('2022-07-15T06:21:00.000Z'));
  });

  it('fixes future times with estimate when time between stations is too short and estimate is reasonable', () => {
    const train = trainFixture();
    train.timeTableRows[1].scheduledTime = '2022-07-15T06:08:00.000Z';
    train.timeTableRows[1].actualTime = '2022-07-15T06:10:00.000Z';
    train.timeTableRows[1].liveEstimateTime = undefined;
    train.timeTableRows[1].trainStopping = true;
    train.timeTableRows[1].commercialStop = true;
    train.timeTableRows[2].scheduledTime = '2022-07-15T06:09:00.000Z';
    train.timeTableRows[2].actualTime = undefined;
    train.timeTableRows[2].liveEstimateTime = '2022-07-15T06:10:00.000Z';
    train.timeTableRows[2].trainStopping = true;
    train.timeTableRows[2].commercialStop = true;
    train.timeTableRows[3].actualTime = undefined;
    train.timeTableRows[3].liveEstimateTime = '2022-07-15T06:16:00.000Z';

    const [transformed] = transformTrains([train]);

    expect(transformed.timetableRows[0].time).toEqual(DateTime.fromISO('2022-07-15T06:00:00.000Z'));
    expect(transformed.timetableRows[1].time).toEqual(DateTime.fromISO('2022-07-15T06:10:00.000Z'));
    expect(transformed.timetableRows[2].time).toEqual(DateTime.fromISO('2022-07-15T06:11:00.000Z'));
    expect(transformed.timetableRows[3].time).toEqual(DateTime.fromISO('2022-07-15T06:17:00.000Z'));
  });

  it('reduces future stopping time to 1 min when stopping time is unreasonable', () => {
    const train = trainFixture();
    train.timeTableRows[1].scheduledTime = '2022-07-15T06:08:00.000Z';
    train.timeTableRows[1].actualTime = '2022-07-15T06:10:00.000Z';
    train.timeTableRows[1].liveEstimateTime = undefined;
    train.timeTableRows[1].trainStopping = true;
    train.timeTableRows[1].commercialStop = true;
    train.timeTableRows[2].scheduledTime = '2022-07-15T06:10:00.000Z';
    train.timeTableRows[2].actualTime = undefined;
    train.timeTableRows[2].liveEstimateTime = '2022-07-15T06:10:00.000Z';
    train.timeTableRows[2].trainStopping = true;
    train.timeTableRows[2].commercialStop = true;
    train.timeTableRows[3].actualTime = undefined;
    train.timeTableRows[3].liveEstimateTime = '2022-07-15T06:16:00.000Z';

    const [transformed] = transformTrains([train]);

    expect(transformed.timetableRows[0].time).toEqual(DateTime.fromISO('2022-07-15T06:00:00.000Z'));
    expect(transformed.timetableRows[1].time).toEqual(DateTime.fromISO('2022-07-15T06:10:00.000Z'));
    expect(transformed.timetableRows[2].time).toEqual(DateTime.fromISO('2022-07-15T06:11:00.000Z'));
    expect(transformed.timetableRows[3].time).toEqual(DateTime.fromISO('2022-07-15T06:16:00.000Z'));
  });

  it.each([
    [0, true, StopType.Commercial],
    [120, true, StopType.Commercial],
    [15, false, StopType.None],
    [60, false, StopType.OtherTraffic],
  ])(
    'determines the stop type',
    (stopDurationSeconds: number, commercialStop: boolean, expectedStopType: StopType) => {
      const train = trainFixture();
      train.timeTableRows[1].actualTime = undefined;
      train.timeTableRows[1].commercialStop = commercialStop;
      train.timeTableRows[2].actualTime = undefined;
      train.timeTableRows[2].scheduledTime = DateTime.fromISO('2022-07-15T06:09:00.000Z')
        .plus({ seconds: stopDurationSeconds })
        .toISO();
      train.timeTableRows[2].commercialStop = commercialStop;
      train.timeTableRows[3].actualTime = undefined;

      const [transformed] = transformTrains([train]);

      expect(transformed.timetableRows[1].stopType).toBe(expectedStopType);
      expect(transformed.timetableRows[2].stopType).toBe(expectedStopType);
    }
  );
});
