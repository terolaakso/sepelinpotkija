import { useContext, useEffect, useRef } from "react";
import { GpsLocation } from "../model/digitraffic";
import { getLocation } from "../model/digitrafficClient";
import { adjustTimetableByLocation } from "../model/timetableCalculation";
import { Train } from "../model/Train";
import {
  getTrainFromContext,
  TrainContext,
  TrainContextProps,
} from "../components/TrainData";
import { transformLocation } from "../model/transform";
import useSubscription from "./mqtt/useSubscription";
import { isNotNil } from "../utils/misc";
import { isNil } from "lodash";

export default function useTrainLocationWatch(
  departureDate: string | null,
  trainNumber: number | null,
  onReceivedNewLocation: (train: Train) => void
) {
  const trainDataRef = useRef<TrainContextProps>();
  const callbackRef = useRef<(train: Train) => void>(() => {});
  const trainDataContext = useContext(TrainContext);

  useEffect(() => {
    trainDataRef.current = trainDataContext;
  }, [trainDataContext]);

  useEffect(() => {
    callbackRef.current = onReceivedNewLocation;
  }, [onReceivedNewLocation]);

  useSubscription<GpsLocation>(
    isNotNil(departureDate) && isNotNil(trainNumber)
      ? `train-locations/${departureDate}/${trainNumber}`
      : null,
    (receivedLocation) => {
      if (isNil(departureDate) || isNil(trainNumber)) {
        return;
      }
      const location = transformLocation(receivedLocation);
      trainDataRef.current?.setLocation(location);
      const train = getTrainFromContext(
        departureDate,
        trainNumber,
        trainDataRef.current ?? null
      );
      if (train) {
        const fixedTrain = adjustTimetableByLocation(
          train,
          location,
          trainDataRef.current?.stations ?? {}
        );
        trainDataRef.current?.setTrain(fixedTrain);
        callbackRef.current(fixedTrain);
      }
    }
  );

  useEffect(() => {
    async function fetchLocation() {
      if (isNil(departureDate) || isNil(trainNumber)) {
        return;
      }
      console.log(new Date().toLocaleTimeString(), "Fetching initial location");

      const latestLocation = await getLocation(departureDate, trainNumber);
      if (!latestLocation) {
        return;
      }
      trainDataRef.current?.setLocation(latestLocation);
      const train = getTrainFromContext(
        departureDate,
        trainNumber,
        trainDataRef.current ?? null
      );
      if (train) {
        const fixedTrain = adjustTimetableByLocation(
          train,
          latestLocation,
          trainDataRef.current?.stations ?? {}
        );
        trainDataRef.current?.setTrain(fixedTrain);
        callbackRef.current(fixedTrain);
      }
    }
    fetchLocation();
  }, [departureDate, trainNumber]);
}
