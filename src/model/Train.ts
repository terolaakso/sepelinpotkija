import { DateTime, Duration } from 'luxon';

import { LateCause } from './lateCauses';

export enum TimeType {
  None = 'None',
  Scheduled = 'Scheduled',
  Estimated = 'Estimated',
  Actual = 'Actual',
}

export enum StopType {
  None = 'None',
  OtherTraffic = 'OtherTraffic',
  Commercial = 'Commercial',
}

export interface Train {
  trainNumber: number;
  departureDate: string;
  name: string;
  timetableRows: TimetableRow[];
  lineId: string | null;
  currentSpeed: number | null;
  currentLateCauses: LateCause[];
  lateMinutes: number | null;
  isReady: boolean;
  latestGpsIndex: number | null;
  latestActualTimeIndex: number;
  timestamp: DateTime;
  version: number;
}

/**
 * key is "{departureDate}-{trainNumber}"
 */
export interface TrainCollection {
  [key: string]: Train | undefined;
}

export interface TimetableRow {
  stationShortCode: string;
  time: DateTime; // our best guess for the time
  bestDigitrafficTime: DateTime; // keep track of the best digitraffic time after it has been logically fixed
  timeType: TimeType;
  scheduledTime: DateTime;
  estimatedTime: DateTime | null;
  actualTime: DateTime | null;
  differenceInMinutes: number;
  stopType: StopType;
  isTrainReady: boolean;
  lateCauses: RowCause[];
}

export interface RowCause {
  level1CodeId: number | null;
  level2CodeId: number | null;
  level3CodeId: number | null;
}

// this is old timetableGpsAge
export function timetableExpirationDuration(train: Train): Duration {
  const index = train.latestGpsIndex ? train.latestGpsIndex + 1 : train.latestActualTimeIndex + 1;

  if (index < train.timetableRows.length) {
    const age = DateTime.now().diff(train.timetableRows[index].time);
    return age;
  }
  return Duration.fromMillis(0);
}
