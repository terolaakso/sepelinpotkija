import { DateTime } from 'luxon';

import { Train } from '@/types/Train';

import { timetableRowFixture } from './timetablerow.fixture';

export function trainFixture(props?: Partial<Train>): Train {
  return {
    ...defaultTrain,
    timetableRows: [
      timetableRowFixture(),
      timetableRowFixture({
        stationShortCode: 'KUT',
        scheduledTime: DateTime.fromISO('2018-12-30T06:06:00.000Z'),
        actualTime: DateTime.fromISO('2018-12-30T06:06:00.000Z'),
        time: DateTime.fromISO('2018-12-30T06:06:00.000Z'),
      }),
    ],
    ...props,
  };
}

const defaultTrain: Train = {
  departureDate: '2018-12-30',
  latestActualTimeIndex: 1,
  timestamp: DateTime.now(),
  gpsFixAttemptTimestamp: DateTime.now(),
  version: 1,
  trainNumber: 1948,
  name: 'MUS 1948',
  currentSpeed: 0,
  currentLateCauses: [],
  latestGpsIndex: 0,
  lateMinutes: 0,
  isReady: false,
  lineId: null,
  timetableRows: [],
};
