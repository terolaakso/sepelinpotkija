import classNames from 'classnames';
import { DateTime } from 'luxon';
import { Fragment } from 'react';

import CommuterBadge from '@/components/CommuterBadge';
import DifferenceBadge from '@/components/DifferenceBadge';
import TrainReadyBadge from '@/components/TrainReadyBadge';
import { LateCauses } from '@/features/lateCauses';

import { TrainEvent } from '../types/TrainEvent';

export interface EventTableRowProps {
  event: TrainEvent;
  hasTracks: boolean;
  showType: boolean;
  isNextEvent: boolean;
}

export default function EventTableRow({
  event,
  hasTracks,
  showType,
  isNextEvent,
}: EventTableRowProps) {
  const now = DateTime.now();
  const rowClasses = classNames('align-text-top', {
    'bg-gray-800': isNextEvent,
    'opacity-70': event.time < now,
  });
  const textClasses = classNames({
    'text-red-700': event.expiresAt !== null && now > event.expiresAt,
  });
  const numericClasses = classNames(textClasses, 'tabular-nums');
  const rightAlignedTextClasses = classNames(textClasses, 'text-right');
  const columnCount = showType ? (hasTracks ? 4 : 3) : hasTracks ? 3 : 2;

  return (
    <Fragment>
      <tr className={rowClasses}>
        <td>
          <div className="flex flex-wrap space-x-1">
            <div className={numericClasses}>{event.time.toFormat('H.mm')}</div>
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
        {showType ? <td className={textClasses}>{event.eventType}</td> : null}
        {hasTracks ? <td className={rightAlignedTextClasses}>{event.track}</td> : null}
      </tr>
      {event.lateCauses.length > 0 ? (
        <tr className={rowClasses}>
          <td colSpan={columnCount} className={textClasses}>
            <LateCauses causes={event.lateCauses} />
          </td>
        </tr>
      ) : null}
    </Fragment>
  );
}
