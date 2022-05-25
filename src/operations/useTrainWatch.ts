import { useContext } from "react";
import { GpsLocation } from "../model/digitraffic";
import { adjustTimetableByLocation } from "../model/timetableCalculation";
import { Train } from "../model/Train";
import { TrainContext } from "../model/TrainData";
import { transformLocation } from "../model/transform";
import useSubscription from "./mqtt/useSubscription";

export default function useTrainWatch(
  train: Train | null,
  onReceivedNewLocation: (train: Train) => void
) {
  const { stations } = useContext(TrainContext);

  useSubscription<GpsLocation>(
    train
      ? "train-locations/" + train.departureDate + "/" + train.trainNumber
      : null,
    (receivedLocation) => {
      if (!train) {
        return;
      }
      const location = transformLocation(receivedLocation);
      const fixedTrain = adjustTimetableByLocation(train, location, stations);
      onReceivedNewLocation(fixedTrain);
    }
  );
}
