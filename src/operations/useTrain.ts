import { isNil } from "lodash";
import { useContext, useEffect, useRef, useState } from "react";
import { TrainContext, TrainContextProps } from "../components/TrainData";
import { getTrain } from "../model/digitrafficClient";
import { Train } from "../model/Train";
import useTrainLocationWatch from "./useTrainLocationWatch";
import useTrainWatch from "./useTrainWatch";

export interface UseTrainProps {
  trainNumber: number | null;
  departureDate?: string | null;
}

export default function useTrain(
  trainNumber: number | null,
  departureDate?: string | null
) {
  const trainDataRef = useRef<TrainContextProps>();
  const trainDataContext = useContext(TrainContext);
  const [train, setTrain] = useState<Train | null>(null);

  useEffect(() => {
    trainDataRef.current = trainDataContext;
  }, [trainDataContext]);

  useEffect(() => {
    async function fetchTrain() {
      if (isNil(trainNumber)) {
        setTrain(null);
        return;
      }
      const train = await getTrain(trainNumber);
      if (!train) {
        setTrain(null);
        return;
      }
      setTrain(train);
      trainDataRef.current?.setTrain(train);
    }
    fetchTrain();
  }, [departureDate, trainNumber]);

  useTrainLocationWatch(
    train ? train.departureDate : null,
    train ? train.trainNumber : null,
    (train) => {
      setTrain(train);
    }
  );

  useTrainWatch(
    train ? train.departureDate : null,
    train ? train.trainNumber : null,
    (train) => {
      setTrain(train);
    }
  );

  return train;
}
