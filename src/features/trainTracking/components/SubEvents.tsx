import { TrainEvent } from '../types/TrainEvent';

import EventContent from './EventContent';

export interface SubEventsProps {
  mainEvent: TrainEvent;
}

export default function SubEvents({ mainEvent }: SubEventsProps) {
  if (mainEvent.subEvents.length === 0) {
    return null;
  }

  return (
    <small className="block">
      {mainEvent.subEvents.map((event) => (
        <EventContent event={event} key={event.id} />
      ))}
    </small>
  );
}
