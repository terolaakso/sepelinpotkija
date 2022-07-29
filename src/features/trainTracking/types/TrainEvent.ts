import { DateTime } from 'luxon';

import { LateCause } from '@/features/lateCauses';

export interface TrainEvent {
  id: string;
  name: string | null;
  time: DateTime;
  departureTime: DateTime | null;
  eventType: TrainEventType;
  lineId: string | null;
  wikiPage: string | null;
  lateMinutes: number | null;
  lateCauses: LateCause[];
  expiresAt: DateTime | null;
  countdown: string;
  relativeProgress: number;
  subEvents: TrainEvent[];
}

export enum TrainEventType {
  Stop = 'Stop',
  Station = 'Station',
  Detail = 'Detail',
  Train = 'Train',
}
