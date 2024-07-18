import CommuterBadge from '@/components/CommuterBadge';
import DifferenceBadge from '@/components/DifferenceBadge';
import TrainReadyBadge from '@/components/TrainReadyBadge';
import { LateCauses } from '@/features/lateCauses';
import { useTrainDataStore } from '@/stores/trainData';
import { Train } from '@/types/Train';

export interface TrainHeaderProps {
  train: Train | null;
  isExpired: boolean;
}

export default function TrainHeader({ train, isExpired }: TrainHeaderProps) {
  const stations = useTrainDataStore((state) => state.stations);

  if (train === null) {
    return null;
  }
  const origin = stations[train.timetableRows[0].stationShortCode]?.name ?? '';
  const destination =
    stations[train.timetableRows[train.timetableRows.length - 1].stationShortCode]?.name ?? '';

  return (
    <>
      <div className="flex space-x-1">
        <DifferenceBadge difference={train.lateMinutes} />
        {isExpired && <div>❗️</div>}
        <div className="flex-grow space-x-1">
          <CommuterBadge lineId={train.lineId} />
          <span>
            {train.name} {origin} - {destination}
          </span>
        </div>
        <div>
          {(train.currentSpeed ?? 0) > 0 && (
            <div className="text-right">{train.currentSpeed} km/h</div>
          )}
          <TrainReadyBadge isReady={train.isReady} />
        </div>
      </div>
      <div>
        <LateCauses causes={train.currentLateCauses} />
      </div>
    </>
  );
}
