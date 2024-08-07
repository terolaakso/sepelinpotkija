import { TrackingEvent } from '../types/TrackingEvent';

import EventInfo from './EventInfo';
import EventProgress from './EventProgress';

export interface TrainContentProps {
  events: TrackingEvent[];
}

export default function TrainContent({ events }: TrainContentProps) {
  if (events.length === 0) {
    return null;
  }

  return (
    <div className="flex-1 mr-1 portrait:flex-initial portrait:mr-0">
      <div className="flex flex-col-reverse">
        {events.map((event) => (
          <div className="flex" key={event.id}>
            <EventProgress event={event} />
            <EventInfo event={event} />
          </div>
        ))}
      </div>
    </div>
  );
}
