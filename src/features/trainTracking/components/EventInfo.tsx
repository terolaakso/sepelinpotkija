import { TrainEvent } from '../types/TrainEvent';

import EventContent from './EventContent';
import SubEvents from './SubEvents';

export interface EventInfoProps {
  event: TrainEvent;
}

export default function EventInfo({ event }: EventInfoProps) {
  return (
    <div className="min-h-10 ml-1 flex-grow">
      <EventContent event={event} />
      <SubEvents mainEvent={event} />
    </div>
  );
}
