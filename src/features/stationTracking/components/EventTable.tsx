import { DateTime } from 'luxon';

import { isNotNil } from '@/utils/misc';

import { StationEvent } from '../types/StationEvent';

import EventTableRow from './EventTableRow';

export interface StationContentProps {
  events: StationEvent[];
}

export default function EventTable({ events }: StationContentProps) {
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
          <th className="text-left modest-text">Tapahtuma</th>
          {hasTracks ? <th className="text-right modest-text">Raide</th> : null}
        </tr>
      </thead>
      <tbody>
        {events.map((event, index, arr) => (
          <EventTableRow
            key={`${event.id}-${event.time.toMillis()}`}
            event={event}
            hasTracks={hasTracks}
            isNextEvent={event.time > now && (index === 0 || arr[index - 1].time < now)}
          />
        ))}
      </tbody>
    </table>
  );
}
