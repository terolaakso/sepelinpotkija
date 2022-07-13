import classNames from 'classnames';
import { DateTime } from 'luxon';

import { TrainEvent, TrainEventType } from '../types/TrainEvent';

export interface EventProgressProps {
  event: TrainEvent;
}

export default function EventProgress({ event }: EventProgressProps) {
  const ballClasses = classNames('border-solid', 'border-4rem', 'rounded-full', 'w-6', 'h-6', {
    'border-red-500': event.eventType === TrainEventType.Stop,
    'border-yellow-500': event.eventType === TrainEventType.Station,
    'border-green-500': event.eventType === TrainEventType.Detail,
    'border-teal-500': event.eventType === TrainEventType.Train,
    'bg-red-700': event.eventType === TrainEventType.Stop && event.time < DateTime.now(),
    'bg-yellow-700': event.eventType === TrainEventType.Station && event.time < DateTime.now(),
    'bg-green-700': event.eventType === TrainEventType.Detail && event.time < DateTime.now(),
    'bg-teal-700': event.eventType === TrainEventType.Train && event.time < DateTime.now(),
  });

  return (
    <div className="flex flex-col">
      <div className={ballClasses} />
      <div className="w-6 flex-grow">
        <div
          className="h-full"
          style={{
            background: 'linear-gradient(#ed8936, #ed8936) no-repeat bottom center',
            backgroundSize: `0.25rem ${event.relativeProgress * 100}%`,
          }}
        />
      </div>
    </div>
  );
}
