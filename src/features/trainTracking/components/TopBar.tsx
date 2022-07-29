import classNames from 'classnames';
import { DateTime } from 'luxon';

import { Train } from '@/types/Train';
import { timetableExpiresAt } from '@/utils/timetableCalculation';

import TrainHeader from './TrainHeader';
import TrainNumberInputForm from './TrainNumberInputForm';

export interface TopBarProps {
  train: Train | null;
  isTracking: boolean;
  startTracking: (trainNumber: number) => void;
}

export default function TopBar({ train, isTracking, startTracking }: TopBarProps) {
  const expiresAt = train !== null ? timetableExpiresAt(train) : null;
  const isTimetableExpired = expiresAt !== null && DateTime.now() > expiresAt;

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
