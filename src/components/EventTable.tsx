import { DateTime } from 'luxon';

import { isNotNil } from '@/utils/misc';

import { TrainEvent } from '../types/TrainEvent';

import EventTableRow from './EventTableRow';

export interface StationContentProps {
  events: TrainEvent[];
  showType: boolean;
}

export default function EventTable({ events, showType }: StationContentProps) {
  if (events.length === 0) {
    return null;
  }

  const hasTracks = events.some((event) => isNotNil(event.track));
  const now = DateTime.now();

  return (
    <table className="w-full">
      <thead>
        <tr>
          <th className="text-left modest-text">Klo</th>
          <th className="text-left modest-text">Juna</th>
          {showType ? <th className="text-left modest-text">Tapahtuma</th> : null}
          {hasTracks ? <th className="text-right modest-text">Raide</th> : null}
        </tr>
      </thead>
      <tbody>
        {events.map((event, index, arr) => (
          <EventTableRow
            key={`${event.name}-${event.time.toMillis()}`}
            event={event}
            hasTracks={hasTracks}
            showType={showType}
            isNextEvent={event.time > now && (index === 0 || arr[index - 1].time < now)}
          />
        ))}
      </tbody>
    </table>
  );
}
