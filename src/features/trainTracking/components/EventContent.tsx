import CommuterBadge from '@/components/CommuterBadge';
import DifferenceBadge from '@/components/DifferenceBadge';

import { TrainEvent } from '../types/TrainEvent';

import EventText from './EventText';

export interface EventContentProps {
  event: TrainEvent;
}
export default function EventContent({ event }: EventContentProps) {
  return (
    <div className="flex">
      <div className="flex-grow">
        <CommuterBadge lineId={event.lineId} />
        <EventText event={event} />
        <DifferenceBadge difference={event.lateMinutes} />
      </div>
      <div>{event.countdown}</div>
    </div>
  );
}
