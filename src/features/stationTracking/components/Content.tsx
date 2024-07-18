import { StationEvent } from '../types/StationEvent';

import EventTable from './EventTable';
import IntroContent from './IntroContent';

export interface ContentProps {
  events: StationEvent[];
  isTracking: boolean;
}

export default function Content({ events, isTracking }: ContentProps) {
  return (
    <div className="flex-grow pt-1 px-1 overflow-y-auto">
      <EventTable events={events} />
      {events.length === 0 && !isTracking ? <IntroContent /> : null}
    </div>
  );
}
