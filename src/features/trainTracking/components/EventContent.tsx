import CommuterBadge from '@/components/CommuterBadge';
import DifferenceBadge from '@/components/DifferenceBadge';
import { LateCauses } from '@/features/lateCauses';

import { TrackingEvent } from '../types/TrackingEvent';

import EventText from './EventText';

export interface EventContentProps {
  event: TrackingEvent;
}
export default function EventContent({ event }: EventContentProps) {
  return (
    <>
      <div className="flex">
        <div className="flex-grow space-x-1">
          <CommuterBadge lineId={event.lineId} />
          <EventText event={event} />
          <DifferenceBadge difference={event.lateMinutes} />
        </div>
        <div className="tabular-nums">{event.countdown}</div>
      </div>
      <LateCauses causes={event.lateCauses} />
    </>
  );
}
