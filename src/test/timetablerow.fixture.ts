import { DateTime } from 'luxon';

import { StopType, TimetableRow, TimeType } from '@/model/Train';

export function timetableRowFixture(props?: Partial<TimetableRow>): TimetableRow {
  return {
    ...defaultTimetableRow,
    ...props,
  };
}

const defaultTimetableRow: TimetableRow = {
  stationShortCode: 'TKU',
  stopType: StopType.Commercial,
  scheduledTime: DateTime.fromISO('2018-12-30T06:03:00.000Z'),
  actualTime: DateTime.fromISO('2018-12-30T06:03:00.000Z'),
  time: DateTime.fromISO('2018-12-30T06:03:00.000Z'),
  bestDigitrafficTime: DateTime.fromISO('2018-12-30T06:03:00.000Z'),
  differenceInMinutes: 0,
  timeType: TimeType.Actual,
  estimatedTime: null,
  isTrainReady: true,
  lateCauses: [],
};
