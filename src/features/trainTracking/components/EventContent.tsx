import CommuterBadge from '@/components/CommuterBadge';
import DifferenceBadge from '@/components/DifferenceBadge';
import { LateCauses } from '@/features/lateCauses';

import { TrainEvent } from '../types/TrainEvent';

import EventText from './EventText';

export interface EventContentProps {
  event: TrainEvent;
}
export default function EventContent({ event }: EventContentProps) {
  return (
    <>
      <div className="flex">
        <div className="flex-grow">
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
