import { TrackingEvent } from '../types/TrackingEvent';

import EventContent from './EventContent';
import SubEvents from './SubEvents';

export interface EventInfoProps {
  event: TrackingEvent;
}

export default function EventInfo({ event }: EventInfoProps) {
  return (
    <div className="min-h-10 ml-1 flex-grow">
      <EventContent event={event} />
      <SubEvents mainEvent={event} />
    </div>
  );
}
