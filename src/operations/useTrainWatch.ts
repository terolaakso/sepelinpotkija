import { useContext, useEffect, useRef } from "react";
import { Train as DigitrafficTrain } from "../model/digitraffic";
import { adjustTimetableByLocation } from "../model/timetableCalculation";
import { Train } from "../model/Train";
import {
  getLocationFromContext,
  TrainContext,
  TrainContextProps,
} from "../components/TrainData";
import { transformTrains } from "../model/transform";
import useSubscription from "./mqtt/useSubscription";
import { isNotNil } from "../utils/misc";
import { isNil } from "lodash";

export default function useTrainWatch(
  departureDate: string | null,
  trainNumber: number | null,
  onReceivedNewTrain: (train: Train) => void
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
      console.log(new Date().toLocaleTimeString(), "Got new train in watch");
      const transformedTrain = transformTrains([receivedTrain])[0];
      const location = getLocationFromContext(
        transformedTrain.departureDate,
        transformedTrain.trainNumber,
        trainDataRef.current ?? null
      );
      const fixedTrain = location
        ? adjustTimetableByLocation(
            transformedTrain,
            location,
            trainDataRef.current?.stations ?? {}
          )
        : transformedTrain;
      trainDataRef.current?.setTrain(fixedTrain);
      onReceivedNewTrain(fixedTrain);
    }
  );
}
