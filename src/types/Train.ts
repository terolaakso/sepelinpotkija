import { DateTime } from 'luxon';

import { LateCause } from '@/features/lateCauses';

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
  receivedTimestamp: DateTime;
  gpsFixAttemptTimestamp: DateTime | null;
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
  scheduledTime: DateTime;
  estimatedTime: DateTime | null;
  actualTime: DateTime | null;
  stopType: StopType;
  isTrainReady: boolean;
  lateCauses: RowCause[];
  track: string | null;
}

export interface RowCause {
  level1CodeId: number | null;
  level2CodeId: number | null;
  level3CodeId: number | null;
}
