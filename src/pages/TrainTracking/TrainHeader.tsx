import { useContext, useEffect, useRef } from "react";
import CommuterBadge from "../../components/CommuterBadge";
import DifferenceBadge from "../../components/DifferenceBadge";
import LateCauses from "../../components/LateCauses";
import { TrainContext, TrainContextProps } from "../../components/TrainData";
import TrainReadyBadge from "../../components/TrainReadyBadge";
import { Train } from "../../model/Train";

export interface TrainHeaderProps {
  train: Train | null;
  isExpired: boolean;
}

export default function TrainHeader({ train, isExpired }: TrainHeaderProps) {
  const trainDataRef = useRef<TrainContextProps>();
  const trainDataContext = useContext(TrainContext);

  useEffect(() => {
    trainDataRef.current = trainDataContext;
  }, [trainDataContext]);

  if (train === null) {
    return null;
  }
  const stations = trainDataRef.current?.stations || {};
  const origin = stations[train.timetableRows[0].stationShortCode]?.name ?? "";
  const destination =
    stations[
      train.timetableRows[train.timetableRows.length - 1].stationShortCode
    ]?.name ?? "";

  return (
    <>
      <div className="flex">
        <DifferenceBadge difference={train.lateMinutes} />
        {isExpired && <div>❗️</div>}
        <div className="flex-grow">
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
