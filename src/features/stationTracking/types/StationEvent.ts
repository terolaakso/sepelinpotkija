import { DateTime } from 'luxon';

import { LateCause } from '@/features/lateCauses';

export interface StationEvent {
  name: string;
  time: DateTime;
  eventType: StationEventType;
  lineId: string | null;
  track: string | null;
  lateMinutes: number | null;
  lateCauses: LateCause[];
  isReady: boolean;
  expiresAt: DateTime | null;
}

export enum StationEventType {
  Arrival = 'Saapuu',
  Departure = 'Lähtee',
  Passing = 'Ohittaa',
}
