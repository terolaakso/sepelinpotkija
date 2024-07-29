import { DateTime } from 'luxon';

import { LateCause } from '@/features/lateCauses';

export interface TrackingEvent {
  id: string;
  name: string;
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
  subEvents: TrackingEvent[];
}

export enum TrainEventType {
  Stop = 'Stop',
  Station = 'Station',
  Detail = 'Detail',
  Train = 'Train',
}
