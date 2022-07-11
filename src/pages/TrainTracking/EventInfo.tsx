import CommuterBadge from '../../components/CommuterBadge';
import DifferenceBadge from '../../components/DifferenceBadge';
import { TrainEvent } from '../../model/TrainEvent';
import EventText from './EventText';

export interface EventInfoProps {
  event: TrainEvent;
}

export default function EventInfo({ event }: EventInfoProps) {
  return (
    <div className="min-h-10 ml-1 flex-grow">
      <div className="flex">
        <div className="flex-grow">
          <CommuterBadge lineId={event.lineId} />
          <EventText event={event} />
          <DifferenceBadge difference={event.lateMinutes} />
        </div>
        <div>{event.countdown}</div>
      </div>
    </div>
  );
}
