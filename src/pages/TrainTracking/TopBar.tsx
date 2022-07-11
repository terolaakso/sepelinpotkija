import classNames from 'classnames';
import { Duration } from 'luxon';

import { timetableExpirationDuration, Train } from '@/model/Train';

import TrainHeader from './TrainHeader';
import TrainNumberInputForm from './TrainNumberInputForm';

export interface TopBarProps {
  train: Train | null;
  isTracking: boolean;
  startTracking: (trainNumber: number) => void;
}

const EXPIRATION_ALERT_THRESHOLD = Duration.fromDurationLike({ minutes: 5 });

export default function TopBar({ train, isTracking, startTracking }: TopBarProps) {
  const isTimetableExpired =
    train !== null && timetableExpirationDuration(train) > EXPIRATION_ALERT_THRESHOLD;

  const className = classNames('px-1', 'mb-1', {
    'bg-red-800': isTimetableExpired,
    'bg-gray-800': !isTimetableExpired,
  });

  return (
    <div className={className}>
      {!isTracking && (
        <TrainNumberInputForm
          initialTrainNumber={train?.trainNumber ?? 1}
          onSubmit={startTracking}
        />
      )}
      <TrainHeader train={train} isExpired={isTimetableExpired} />
    </div>
  );
}
