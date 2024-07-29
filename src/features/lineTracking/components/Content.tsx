import EventTable from '@/components/EventTable';
import { TrainEvent } from '@/types/TrainEvent';

import IntroContent from './IntroContent';

export interface ContentProps {
  events: TrainEvent[];
  isTracking: boolean;
}

export default function Content({ events, isTracking }: ContentProps) {
  return (
    <div className="flex-grow pt-1 px-1 overflow-y-auto">
      <EventTable events={events} showType={false} />
      {events.length === 0 && !isTracking ? <IntroContent /> : null}
    </div>
  );
}
