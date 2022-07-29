import { DateTime } from 'luxon';

import { TrainEvent, TrainEventType } from '../types/TrainEvent';

export function trainEventFixture(props?: Partial<TrainEvent>): TrainEvent {
  return {
    ...defaultEvent,
    ...props,
  };
}

const defaultEvent: TrainEvent = {
  countdown: '',
  departureTime: null,
  eventType: TrainEventType.Stop,
  id: 'ABC',
  wikiPage: null,
  lateCauses: [],
  lateMinutes: null,
  lineId: null,
  name: 'Abc',
  relativeProgress: 0,
  subEvents: [],
  time: DateTime.fromISO('2018-12-30T06:00:00.000Z'),
  expiresAt: null,
};
