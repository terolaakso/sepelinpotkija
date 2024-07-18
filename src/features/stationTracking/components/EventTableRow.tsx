import classNames from 'classnames';
import { DateTime } from 'luxon';
import { Fragment } from 'react';

import CommuterBadge from '@/components/CommuterBadge';
import DifferenceBadge from '@/components/DifferenceBadge';
import TrainReadyBadge from '@/components/TrainReadyBadge';
import { LateCauses } from '@/features/lateCauses';

import { StationEvent } from '../types/StationEvent';

export interface EventTableRowProps {
  event: StationEvent;
  hasTracks: boolean;
  isNextEvent: boolean;
}

export default function EventTableRow({ event, hasTracks, isNextEvent }: EventTableRowProps) {
  const now = DateTime.now();
  const rowClasses = classNames('align-text-top', {
    'bg-gray-800': isNextEvent,
    'opacity-70': event.time < now,
  });
  const textClasses = classNames({
    'text-red-700': event.expiresAt !== null && now > event.expiresAt,
  });
  const rightAlignedTextClasses = classNames(textClasses, 'text-right');
  return (
    <Fragment>
      <tr className={rowClasses}>
        <td>
          <div className="flex space-x-1">
            <div className={textClasses}>{event.time.toFormat('H.mm')}</div>
            <DifferenceBadge difference={event.lateMinutes} />
            <TrainReadyBadge isReady={event.isReady} />
          </div>
        </td>
        <td>
          <div className="flex space-x-1">
            <CommuterBadge lineId={event.lineId} />
            <div className={textClasses}>{event.name}</div>
          </div>
        </td>
        <td className={textClasses}>{event.eventType}</td>
        {hasTracks ? <td className={rightAlignedTextClasses}>{event.track}</td> : null}
      </tr>
      {event.lateCauses.length > 0 ? (
        <tr className={rowClasses}>
          <td colSpan={hasTracks ? 4 : 3} className={textClasses}>
            <LateCauses causes={event.lateCauses} />
          </td>
        </tr>
      ) : null}
    </Fragment>
  );
}
