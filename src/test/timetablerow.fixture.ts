import { DateTime } from 'luxon';

import { StopType, TimetableRow } from '@/types/Train';

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
  estimatedTime: null,
  isTrainReady: true,
  lateCauses: [],
};
