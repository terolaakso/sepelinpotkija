import { useContext, useEffect, useRef } from "react";
import { Train as DigitrafficTrain } from "../model/digitraffic";
import { fillNewTrainWithDetails } from "../model/timetableCalculation";
import { TrainContext, TrainContextProps } from "../components/TrainData";
import { transformTrains } from "../model/transform";
import useSubscription from "./mqtt/useSubscription";
import { isNotNil } from "../utils/misc";
import { isNil } from "lodash";

export default function useTrainWatch(
  departureDate: string | null,
  trainNumber: number | null
) {
  const trainDataRef = useRef<TrainContextProps>();
  const trainDataContext = useContext(TrainContext);

  useEffect(() => {
    trainDataRef.current = trainDataContext;
  }, [trainDataContext]);

  useSubscription<DigitrafficTrain>(
    isNotNil(departureDate) && isNotNil(trainNumber)
      ? `trains/${departureDate}/${trainNumber}/#`
      : null,
    (receivedTrain) => {
      if (isNil(departureDate) || isNil(trainNumber)) {
        return;
      }
      const transformedTrain = transformTrains([receivedTrain])[0];
      const fixedTrain = trainDataRef.current
        ? fillNewTrainWithDetails(transformedTrain, trainDataRef.current)
        : transformedTrain;
      trainDataRef.current?.setTrain(fixedTrain);
    }
  );
}
