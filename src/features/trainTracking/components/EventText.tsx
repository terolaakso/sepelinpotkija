import classNames from 'classnames';
import { DateTime } from 'luxon';

import { TrainEvent } from '../types/TrainEvent';

export interface EventTextProps {
  event: TrainEvent;
}

export default function EventText({ event }: EventTextProps) {
  const textClasses = classNames('mr-1', {
    'text-red-700': event.expiresAt !== null && DateTime.now() > event.expiresAt,
  });
  return <span className={textClasses}>{event.name}</span>;
}
