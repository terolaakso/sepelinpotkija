import { DateTime } from 'luxon';

import { LateCause } from '@/features/lateCauses';

export interface TrainEvent {
  name: string;
  time: DateTime;
  eventType: TrainEventType;
  lineId: string | null;
  track: string | null;
  lateMinutes: number | null;
  lateCauses: LateCause[];
  isReady: boolean;
  expiresAt: DateTime | null;
}

export enum TrainEventType {
  Arrival = 'Saapuu',
  Departure = 'Lähtee',
  Passing = 'Ohittaa',
}
