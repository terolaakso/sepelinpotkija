import { DateTime } from 'luxon';

import { TrackingEvent, TrainEventType } from '../types/TrackingEvent';

export function trainEventFixture(props?: Partial<TrackingEvent>): TrackingEvent {
  return {
    ...defaultEvent,
    ...props,
  };
}

const defaultEvent: TrackingEvent = {
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
