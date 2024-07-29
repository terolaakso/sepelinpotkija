import classNames from 'classnames';
import { DateTime } from 'luxon';

import { TrackingEvent } from '../types/TrackingEvent';

export interface EventTextProps {
  event: TrackingEvent;
}

export default function EventText({ event }: EventTextProps) {
  const textClasses = classNames({
    'text-red-700': event.expiresAt !== null && DateTime.now() > event.expiresAt,
  });
  return <span className={textClasses}>{event.name}</span>;
}
